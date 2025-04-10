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

interface ElectionAnnouncementEmailProps {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  electionName?: string;
  electionLogo?: string;
  electionDescription?: string;
  electionDate?: string;
  electionStartTime?: string;
  electionEndTime?: string;
  departmentName?: string;
  pollingStation?: string;
  loginLink?: string;
  candidateInfoLink?: string;
  candidates?: {
    name: string;
    position: string;
    imageUrl?: string;
  }[];
  importantDates?: {
    event: string;
    date: string;
  }[];
}

const baseUrl = process.env.BASE_URL || "https://yourelectionsite.com";

export const ElectionAnnouncementEmail = ({
  firstName,
  lastName,
  middleName,
  electionName,
  electionLogo,
  electionDescription,
  electionDate,
  electionStartTime,
  electionEndTime,
  departmentName,
  pollingStation,
  loginLink,
  candidateInfoLink,
  candidates,
  importantDates,
}: ElectionAnnouncementEmailProps) => {
  const fullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`;
  const previewText = `Announcement: ${electionName}`;

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Preview>{previewText}</Preview>
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={electionLogo || `${baseUrl}/static/election-logo.png`}
                width="80"
                height="80"
                alt={`${electionName} Logo`}
                className="my-0 mx-auto"
              />
            </Section>

            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Announcing: <strong>{electionName}</strong>
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Hello {fullName},
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              We are pleased to announce the upcoming{" "}
              <strong>{electionName}</strong>.
              {electionDescription && ` ${electionDescription}`}
            </Text>

            <Section className="bg-blue-50 border border-solid border-blue-200 rounded p-4 my-6">
              <Text className="text-blue-800 text-[14px] font-semibold mb-2">
                Election Details:
              </Text>
              {electionDate && (
                <Text className="text-black text-[14px] leading-[24px] mb-1">
                  <strong>Date:</strong> {electionDate}
                </Text>
              )}
              {electionStartTime && electionEndTime && (
                <Text className="text-black text-[14px] leading-[24px] mb-1">
                  <strong>Time:</strong> {electionStartTime} - {electionEndTime}
                </Text>
              )}
              {departmentName && (
                <Text className="text-black text-[14px] leading-[24px] mb-1">
                  <strong>Department:</strong> {departmentName}
                </Text>
              )}
              {pollingStation && (
                <Text className="text-black text-[14px] leading-[24px]">
                  <strong>Polling Station:</strong> {pollingStation}
                </Text>
              )}
            </Section>

            {importantDates && importantDates.length > 0 && (
              <>
                <Text className="text-black text-[16px] font-semibold mt-6 mb-2">
                  Important Dates
                </Text>
                {importantDates.map((item, index) => (
                  <Text
                    key={index}
                    className="text-black text-[14px] leading-[24px] mb-1"
                  >
                    <strong>{item.event}:</strong> {item.date}
                  </Text>
                ))}
              </>
            )}

            {candidates && candidates.length > 0 && (
              <>
                <Text className="text-black text-[16px] font-semibold mt-6 mb-2">
                  Candidates
                </Text>
                {candidates.map((candidate, index) => (
                  <Text
                    key={index}
                    className="text-black text-[14px] leading-[24px] mb-1"
                  >
                    <strong>{candidate.name}</strong> - {candidate.position}
                  </Text>
                ))}
                {candidateInfoLink && (
                  <Text className="text-black text-[14px] leading-[24px] mt-2">
                    <Link
                      href={candidateInfoLink}
                      className="text-blue-600 no-underline"
                    >
                      View full candidate profiles
                    </Link>
                  </Text>
                )}
              </>
            )}

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-blue-600 rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={loginLink}
              >
                Learn More
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              You are receiving this email because you are eligible to vote in
              this election. Prior to the election, you will receive your voting
              credentials. If you have any questions, please contact the
              election administrator.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ElectionAnnouncementEmail.PreviewProps = {
  firstName: "John",
  lastName: "Smith",
  middleName: "David",
  electionName: "Student Council Election 2025",
  electionLogo: "https://yourelectionsite.com/static/election-logo.png",
  electionDescription:
    "This election will determine the new Student Council representatives for the 2025-2026 academic year.",
  electionDate: "April 15, 2025",
  electionStartTime: "8:00 AM",
  electionEndTime: "5:00 PM",
  departmentName: "Computer Science",
  pollingStation: "Building A, Room 101",
  loginLink: "https://yourelectionsite.com/election-info",
  candidateInfoLink: "https://yourelectionsite.com/candidates",
  candidates: [
    { name: "Jane Doe", position: "President" },
    { name: "Michael Johnson", position: "Vice President" },
    { name: "Sarah Lee", position: "Secretary" },
  ],
  importantDates: [
    { event: "Candidate Registration Deadline", date: "March 15, 2025" },
    { event: "Candidate Debate", date: "April 5, 2025" },
    { event: "Voting Period", date: "April 15-17, 2025" },
    { event: "Results Announcement", date: "April 20, 2025" },
  ],
} as ElectionAnnouncementEmailProps;

export default ElectionAnnouncementEmail;
