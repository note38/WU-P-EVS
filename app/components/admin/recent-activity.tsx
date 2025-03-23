import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const recentActivities = [
  {
    user: "Alice Johnson",
    action: "Created a new election",
    time: "2 hours ago",
  },
  {
    user: "Bob Smith",
    action: "Modified voter list",
    time: "4 hours ago",
  },
  {
    user: "Charlie Brown",
    action: "Exported election results",
    time: "6 hours ago",
  },
  {
    user: "Diana Prince",
    action: "Updated security settings",
    time: "1 day ago",
  },
];

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {recentActivities.map((activity, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`/avatars/0${index + 1}.png`} alt="Avatar" />
            <AvatarFallback>
              {activity.user
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.user}</p>
            <p className="text-sm text-muted-foreground">{activity.action}</p>
          </div>
          <div className="ml-auto font-medium text-sm text-muted-foreground">
            {activity.time}
          </div>
        </div>
      ))}
    </div>
  );
}
