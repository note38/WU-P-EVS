import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  TooltipProps,
} from "recharts";
import { Minimize } from "lucide-react";
import { Candidate, Position } from "./moc-data";
import { useEffect } from "react";

interface FullscreenResultsProps {
  positions: Position[];
  showNames: boolean;
  toggleFullscreen: () => void;
  setShowNames: (show: boolean) => void;
}

export default function FullscreenResults({
  positions,
  showNames,
  toggleFullscreen,
  setShowNames,
}: FullscreenResultsProps) {
  const formatXAxis = (value: string): string => {
    if (!showNames) return "";
    return value;
  };

  // Handle Escape key press to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        toggleFullscreen();
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleFullscreen]);

  return (
    <div className="fixed inset-0 bg-background z-50 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Election Results</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-names-fs"
              checked={showNames}
              onCheckedChange={setShowNames}
            />
            <Label htmlFor="show-names-fs">Show Names</Label>
          </div>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Minimize className="h-4 w-4" />
            <span className="sr-only">Exit fullscreen</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {positions.map((position) => (
          <Card key={position.title} className="h-[250px]">
            <CardHeader className="pb-2">
              <CardTitle>{position.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={position.candidates}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatXAxis}
                    />
                    <YAxis />
                    <Tooltip
                      content={(props: TooltipProps<number, string>) => {
                        if (
                          props.active &&
                          props.payload &&
                          props.payload.length
                        ) {
                          const data = props.payload[0].payload as Candidate;
                          return (
                            <div className="bg-background p-2 border rounded shadow-sm">
                              {showNames ? (
                                <>
                                  <p className="font-medium">{data.name}</p>
                                  <p className="font-bold">
                                    {data.votes} votes
                                  </p>
                                </>
                              ) : (
                                <p className="font-bold">{data.votes} votes</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="votes" fill="#00D100" radius={[4, 4, 0, 0]}>
                      {!showNames && (
                        <LabelList
                          dataKey="votes"
                          position="center"
                          fill="#ffffff"
                        />
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
