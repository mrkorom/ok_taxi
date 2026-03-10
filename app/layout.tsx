import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "택시 운용 관리 시스템",
    description: "택시 기사 및 차량 배차 관리 프로그램",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}
