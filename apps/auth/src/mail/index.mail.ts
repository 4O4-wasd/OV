import { Resend } from "resend";
import { env } from "../env.js";

export type OtpPurpose = "verify-email" | "reset-password";

const SUBJECTS: Record<OtpPurpose, string> = {
    "verify-email": "Verify your email",
    "reset-password": "Reset your password",
};

const FROM = `OV <no-reply@${env.DNS}>`;

const resend = new Resend(env.RESEND_API_KEY);

export async function sendOtpEmail(
    to: string,
    otp: string,
    purpose: OtpPurpose,
) {
    const { default: OtpEmail } = await import("./templates/otp.mail.js");
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: SUBJECTS[purpose],
        react: OtpEmail({ otp, email: to, purpose }),
    });

    if (error) {
        console.error(
            `Failed to send ${purpose} OTP to ${to}: ${error.message}`,
        );
        throw new Error("Failed to send email");
    }
}
