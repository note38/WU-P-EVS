import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">9</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Available Polls</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Best Programming Language</CardTitle>
            </CardHeader>
            <CardContent>
              <Button>Vote Now</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Favorite Text Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <Button>Vote Now</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
