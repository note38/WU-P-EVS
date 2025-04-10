// File: src/components/Dashboard/ElectionResults.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Candidate, Position } from "./moc-data";

interface ElectionResultsProps {
  positions: Position[];
  showNames: boolean;
  isFullscreen: boolean;
}

export default function ElectionResults({
  positions,
  showNames,
  isFullscreen,
}: ElectionResultsProps) {
  // Custom formatter for X-axis labels
  const formatXAxis = (value: string): string => {
    if (!showNames) return ""; // Return empty string to hide names
    return value; // Return the actual name when showNames is true
  };

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {positions.map((position) => (
        <Card key={position.title} className="h-[350px]">
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
                    tick={{ fontSize: 12 }}
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
                                <p className="font-bold">{data.votes} votes</p>
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
  );
}
