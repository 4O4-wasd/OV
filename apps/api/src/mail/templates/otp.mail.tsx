import {
    Body,
    Column,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
    pixelBasedPreset,
    type TailwindConfig,
} from "react-email";

interface OtpEmailProps {
    otp: string;
    email: string;
    purpose: "verify-email" | "reset-password";
    expiryMinutes?: number;
}

const PURPOSE_META = {
    "verify-email": {
        heading: "Verify your email",
        body: "Type this code where you signed in to finish setting up your account.",
        dot: "#0E8345",
        label: "VERIFY EMAIL",
        preview: (code: string) =>
            `Your OV code is ${code} — expires in 15 minutes`,
    },
    "reset-password": {
        heading: "Reset your password",
        body: "Type this code to choose a new password for your account.",
        dot: "#B45309",
        label: "RESET PASSWORD",
        preview: (code: string) =>
            `Password reset code: ${code} — expires in 15 minutes`,
    },
} as const;

const config = {
    presets: [pixelBasedPreset],
    theme: {
        extend: {
            colors: {
                canvas: "#E9EBEF",
                card: "#FFFFFF",
                rule: "#DFE2E8",
                ink: "#16181D",
                muted: "#61656F",
                capBg: "#F6F7F9",
                capBorder: "#D6D9DF",
                capTop: "#B9BDC6",
            },
        },
    },
} satisfies TailwindConfig;

export default function OtpEmail({
    otp,
    email,
    purpose,
    expiryMinutes = 15,
}: OtpEmailProps) {
    const meta = PURPOSE_META[purpose];

    return (
        <Html lang="en">
            <Head />
            <Tailwind config={config}>
                <Body className="m-0 bg-canvas font-sans">
                    <Preview>{meta.preview(otp)}</Preview>
                    <Container className="mx-auto my-[180px] w-full max-w-[440px] rounded-[10px] border border-solid border-rule bg-card">
                        <Section className="px-7 pt-5">
                            <Text className="m-0 font-mono text-[11px] tracking-[2px] text-muted">
                                <span style={{ color: meta.dot }}>●</span>
                                {"  OV / AUTH / "}
                                {meta.label}
                            </Text>
                        </Section>

                        <Section className="px-7 pt-3">
                            <Text className="m-0 font-mono text-[20px] font-semibold text-ink">
                                {meta.heading}
                            </Text>
                            <Text className="m-0 mt-2.5 text-[14px] leading-[22px] text-muted">
                                {meta.body}
                            </Text>
                        </Section>

                        <Section className="px-7 py-5">
                            <Text className="m-0 mb-2.5 font-mono text-[10px] tracking-[1.5px] text-muted">
                                EXPIRES IN {expiryMinutes} MIN
                            </Text>
                            <Row>
                                {otp.split("").map((d, i) => (
                                    <Column
                                        key={i}
                                        align="center"
                                        className={
                                            i === 5 ? "w-1/6 h-[56px]" : (
                                                "w-1/6 h-[56px] pr-2"
                                            )
                                        }
                                    >
                                        <div className="h-[56px] rounded-md border border-solid border-capBorder border-t-2 border-t-capTop bg-capBg align-middle font-mono text-[26px] font-semibold leading-[56px] text-ink">
                                            {d}
                                        </div>
                                    </Column>
                                ))}
                            </Row>
                        </Section>

                        <Section className="px-7 pb-5">
                            <Text className="m-0 text-[12px] leading-[19px] text-muted">
                                Code sent to{" "}
                                <strong className="text-ink">{email}</strong>
                            </Text>
                        </Section>

                        <Hr className="m-0 w-full border border-solid border-rule" />

                        <Section className="px-7 pb-5 pt-4">
                            <Text className="m-0 text-[11px] leading-[17px] text-muted">
                                If this wasn't you, please ignore this email.
                            </Text>
                            <Text className="m-0 mt-2 font-mono text-[11px] text-muted">
                                no-reply@ov.404wasd.com
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

OtpEmail.PreviewProps = {
    otp: "482913",
    email: "jane@example.com",
    purpose: "verify-email",
    expiryMinutes: 15,
} as OtpEmailProps;
