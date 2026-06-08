import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "./mongoose";
import User from "@/models/User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";

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
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        await connectToDatabase();
        
        // If OTP is provided, verify it (Registration or Login via OTP flow)
        if (credentials.otp) {
           const validOtp = await Otp.findOne({ email: credentials.email, otp: credentials.otp });
           if (!validOtp) {
              throw new Error("รหัส OTP ไม่ถูกต้อง หรือหมดอายุ");
           }
           // OTP is correct, we can delete it
           await Otp.deleteOne({ _id: validOtp._id });
           
           let user = await User.findOne({ email: credentials.email });
           if (!user) {
              const hashedPassword = credentials.password ? await bcrypt.hash(credentials.password, 10) : undefined;
              user = await User.create({
                 name: credentials.email.split("@")[0],
                 email: credentials.email,
                 password: hashedPassword
              });
           } else if (credentials.password) {
              // Update password if they logged in via OTP and provided a new password
              user.password = await bcrypt.hash(credentials.password, 10);
              await user.save();
           }
           return { id: user._id.toString(), name: user.name, email: user.email, image: user.avatar };
        } else {
           // Normal password login flow
           if (!credentials.password) throw new Error("กรุณากรอกรหัสผ่าน");
           
           const user = await User.findOne({ email: credentials.email });
           if (!user) throw new Error("ไม่พบอีเมลนี้ในระบบ");
           
           if (!user.password) throw new Error("บัญชีนี้ไม่ได้ตั้งรหัสผ่านไว้ (อาจสมัครผ่าน Google/LINE)");
           
           const isMatch = await bcrypt.compare(credentials.password, user.password);
           if (!isMatch) throw new Error("รหัสผ่านไม่ถูกต้อง");
           
           return { id: user._id.toString(), name: user.name, email: user.email, image: user.avatar, role: user.role };
        }
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
              });
            } else {
              if (account.provider === "google") existingUser.googleId = user.id;
              if (account.provider === "line") existingUser.lineId = user.id;
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
        // user is only passed on the first sign in
        try {
           await connectToDatabase();
           let dbUser;
           if (user.email) {
             dbUser = await User.findOne({ email: user.email });
           } else if (account?.provider === "line") {
             dbUser = await User.findOne({ lineId: user.id });
           } else if (user.name) {
             dbUser = await User.findOne({ name: user.name });
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
             (session.user as any).vipLevel = dbUser.vipLevel;
             (session.user as any).role = dbUser.role;
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
             (session.user as any).vipLevel = dbUser.vipLevel;
             (session.user as any).role = dbUser.role;
           }
         } catch(e) {}
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "raredrop_secret_key_123", // Fallback for dev
};
