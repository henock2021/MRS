import {
  Compass,
  Binoculars,
  Shovel,
  Sparkles,
  Tent,
  Camera,
  GraduationCap,
  Trees,
} from "lucide-react";

interface InterestCountItem {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

interface InterestDistributionChartProps {
  data: InterestCountItem[];
  totalMembers: number;
}

const interestIcons: Record<string, React.ElementType> = {
  hiking: Compass,
  "bird watching": Binoculars,
  "tree planting": Shovel,
  "clean-up": Sparkles,
  camping: Tent,
  photography: Camera,
  education: GraduationCap,
};

export default function InterestDistributionChart({
  data,
  totalMembers,
}: InterestDistributionChartProps) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-700" />
            <span>Members by Activity & Interest Area</span>
          </h2>
          <p className="text-xs text-stone-500">
            Distribution of passions across the membership base ({totalMembers} total naturalists).
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
          Multi-Interest Analytics
        </span>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const Icon = interestIcons[item.id] || Compass;
          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-stone-800">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-emerald-900 font-bold">{item.count}</span>
                  <span className="text-stone-400 font-normal text-[11px]">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
