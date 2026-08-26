import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";
import CredentialsProvider from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { connectToDatabase } from "./mongoose";
import User from "@/models/User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";
import { verifySmsOtp } from "./sepsms";

// ใช้ตรวจจับการสมัครหลายบัญชีจาก IP เดียวกัน (ป้องกันปั๊มรางวัลเชิญเพื่อน) — best-effort เท่านั้น
async function getClientIp(): Promise<string | undefined> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return h.get("x-real-ip") || undefined;
  } catch {
    return undefined;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID || "",
      clientSecret: process.env.LINE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        await connectToDatabase();

        // --- Phone + OTP flow (verify ผ่าน SepSMS) ---
        if (credentials?.phone && credentials?.otp) {
          const otpRecord = await Otp.findOne({ phone: credentials.phone });
          if (!otpRecord?.reference) throw new Error("ไม่พบรหัสอ้างอิง OTP กรุณาขอรหัสใหม่");

          const verified = await verifySmsOtp(otpRecord.reference, credentials.otp);
          if (!verified) throw new Error("รหัส OTP ไม่ถูกต้อง หรือหมดอายุ");
          await Otp.deleteOne({ _id: otpRecord._id });

          let user = await User.findOne({ phone: credentials.phone });
          if (!user) {
            user = await User.create({
              name: "ผู้ใช้" + credentials.phone.slice(-4),
              phone: credentials.phone,
              signupIp: await getClientIp(),
            });
          }
          return { id: user._id.toString(), name: user.name, email: user.email ?? null, image: user.avatar ?? null };
        }

        if (!credentials?.email) return null;

        // --- Email + OTP flow (registration / passwordless) ---
        if (credentials.otp) {
           const validOtp = await Otp.findOne({ email: credentials.email, otp: credentials.otp });
           if (!validOtp) {
              throw new Error("รหัส OTP ไม่ถูกต้อง หรือหมดอายุ");
           }
           await Otp.deleteOne({ _id: validOtp._id });

           let user = await User.findOne({ email: credentials.email });
           if (!user) {
              throw new Error("ไม่พบบัญชีอีเมลนี้ในระบบ กรุณาสมัครสมาชิกด้วยเบอร์โทรศัพท์แทน");
           } else if (credentials.password) {
              user.password = await bcrypt.hash(credentials.password, 10);
              await user.save();
           }
           return { id: user._id.toString(), name: user.name, email: user.email, image: user.avatar };
        }

        // --- Normal password login ---
        if (!credentials.password) throw new Error("กรุณากรอกรหัสผ่าน");

        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("ไม่พบอีเมลนี้ในระบบ");

        if (!user.password) throw new Error("บัญชีนี้ไม่ได้ตั้งรหัสผ่านไว้ (อาจสมัครผ่าน Google/LINE)");

        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error("รหัสผ่านไม่ถูกต้อง");

        return { id: user._id.toString(), name: user.name, email: user.email, image: user.avatar, role: user.role };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "line") {
        try {
          await connectToDatabase();
          
          let existingUser = null;
          
          if (account.provider === "google") {
            existingUser = await User.findOne({ googleId: user.id });
          } else if (account.provider === "line") {
            existingUser = await User.findOne({ lineId: user.id });
          }

          if (!existingUser) {
            if (user.email) {
               existingUser = await User.findOne({ email: user.email });
            }
            
            if (!existingUser) {
              existingUser = await User.create({
                name: user.name || "Unknown",
                email: user.email,
                avatar: user.image,
                googleId: account.provider === "google" ? user.id : undefined,
                lineId: account.provider === "line" ? user.id : undefined,
                signupIp: await getClientIp(),
              });
            } else {
              if (account.provider === "google") existingUser.googleId = user.id;
              if (account.provider === "line") existingUser.lineId = user.id;
              if (!existingUser.avatar && user.image) existingUser.avatar = user.image;
              await existingUser.save();
            }
          }
          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        try {
           await connectToDatabase();
           let dbUser;
           // ใช้ id จาก authorize ก่อน (ครอบคลุม phone user ที่ไม่มี email)
           if (user.id) {
             dbUser = await User.findById(user.id);
           }
           if (!dbUser && user.email) {
             dbUser = await User.findOne({ email: user.email });
           }
           if (!dbUser && account?.provider === "line") {
             dbUser = await User.findOne({ lineId: user.id });
           }

           if (dbUser) {
             token.id = dbUser._id.toString();
             token.role = dbUser.role;
           }
        } catch(e) {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
         try {
           await connectToDatabase();
           const dbUser = await User.findById(token.id);
           if (dbUser) {
             (session.user as any).id = dbUser._id.toString();
             (session.user as any).coins = dbUser.coins;
             (session.user as any).gemCoins = dbUser.gemCoins;
             (session.user as any).vipLevel = dbUser.vipLevel;
             (session.user as any).role = dbUser.role;
             if (dbUser.avatar) (session.user as any).image = dbUser.avatar;
           }
         } catch(e) {}
      } else if (token && token.sub) {
         // Fallback for existing users without token.id (e.g. LINE users)
         try {
           await connectToDatabase();
           let dbUser = await User.findOne({ lineId: token.sub });
           if (!dbUser && session.user && session.user.email) {
             dbUser = await User.findOne({ email: session.user.email });
           }
           if (dbUser) {
             (session.user as any).id = dbUser._id.toString();
             (session.user as any).coins = dbUser.coins;
             (session.user as any).gemCoins = dbUser.gemCoins;
             (session.user as any).vipLevel = dbUser.vipLevel;
             (session.user as any).role = dbUser.role;
             if (dbUser.avatar) (session.user as any).image = dbUser.avatar;
           }
         } catch(e) {}
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "raredrop_secret_key_123", // Fallback for dev
};
