import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface VoterCredentialsEmailProps {
  voterId?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  password?: string; // Plain password to be sent to the voter
  electionName?: string;
  electionLogo?: string;
  departmentName?: string;
  pollingStation?: string;
  loginLink?: string;
}

const baseUrl = process.env.BASE_URL || "https://yourelectionsite.com";

export const VoterCredentialsEmail = ({
  voterId,
  firstName,
  lastName,
  middleName,
  email,
  password,
  electionName,
  electionLogo,
  departmentName,
  pollingStation,
  loginLink,
}: VoterCredentialsEmailProps) => {
  const fullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`;
  const previewText = `Your Voting Credentials for ${electionName}`;

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Preview>{previewText}</Preview>
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src="/wup-logo.png"
                width="80"
                height="80"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Your Voting Credentials for <strong>{electionName}</strong>
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {fullName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              You have been registered as a voter for the{" "}
              <strong>{electionName}</strong> election. Please use the
              credentials below to log in and cast your vote.
            </Text>

            <Section className="bg-gray-50 border border-solid border-gray-200 rounded p-4 my-6">
              <Text className="text-black text-[14px] font-semibold mb-2">
                Your Login Credentials:
              </Text>

              <Text className="text-black text-[14px] leading-[24px] mb-1">
                <strong>Email:</strong> {email}
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                <strong>Password:</strong> {password}
              </Text>
            </Section>

            {departmentName && (
              <Text className="text-black text-[14px] leading-[24px]">
                <strong>Department:</strong> {departmentName}
              </Text>
            )}

            {pollingStation && (
              <Text className="text-black text-[14px] leading-[24px]">
                <strong>Polling Station:</strong> {pollingStation}
              </Text>
            )}

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-blue-600 rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={loginLink}
              >
                Login to Vote
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              or copy and paste this URL into your browser:{" "}
              <Link href={loginLink} className="text-blue-600 no-underline">
                {loginLink}
              </Link>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email contains your confidential voting credentials. Do not
              share this information with anyone. If you were not expecting this
              email or have any questions, please contact the election
              administrator.
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              For security reasons, we recommend changing your password after
              your first login.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

VoterCredentialsEmail.PreviewProps = {
  voterId: "V12345",
  firstName: "John",
  lastName: "Smith",
  middleName: "David",
  email: "john.smith@example.com",
  password: "Temp1234!",
  electionName: "Student Council Election 2025",
  departmentName: "Computer Science",
  pollingStation: "Building A, Room 101",
  loginLink: "https://yourelectionsite.com/login",
} as VoterCredentialsEmailProps;

export default VoterCredentialsEmail;
