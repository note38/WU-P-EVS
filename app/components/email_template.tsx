import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
  lastName: string;
  voterId: string;
  pollingLocation: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  firstName,
  lastName,
  voterId,
  pollingLocation,
}) => (
  <div>
    <h1>Your Voter Credentials</h1>
    <p>
      Dear {firstName} {lastName},
    </p>
    <p>Here are your important voting details:</p>
    <ul>
      <li>Voter ID: {voterId}</li>
      <li>Polling Location: {pollingLocation}</li>
    </ul>
    <p>
      Please keep this information confidential and bring a valid ID to your
      polling location.
    </p>
    <p>If you have any questions, contact your local election commission.</p>
  </div>
);
