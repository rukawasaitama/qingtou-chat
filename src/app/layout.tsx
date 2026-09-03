import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "课文角色对话 - 和课本里的角色做朋友",
  description: "一个让小学生和语文课本中的角色进行互动对话的学习工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
