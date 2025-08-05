import * as React from "react";
import {
  Html,
  Head,
  Font,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
} from "@react-email/components";

interface VerificationEmailProps {
  username: string;
  otp: string;
}

export default function VerificationEmail({
  username,
  otp,
}: VerificationEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Your verification code is {otp}</Preview>
      <Body
        style={{
          fontFamily: "Roboto, Arial, sans-serif",
          backgroundColor: "#f9f9f9",
          padding: "20px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <Section>
            <Heading as="h2" style={{ color: "#333" }}>
              Hello {username},
            </Heading>
            <Text style={{ fontSize: "16px", color: "#555" }}>
              Thank you for registering. Please use the following verification
              code to complete your registration:
            </Text>
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#000",
                textAlign: "center",
              }}
            >
              {otp}
            </Text>
            <Text style={{ fontSize: "14px", color: "#999" }}>
              If you did not request this, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
