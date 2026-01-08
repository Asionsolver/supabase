import React from "react";

const Skeleton = () => (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <div key={i} className="border rounded-lg p-3 bg-card/50 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded" />
        </div>
        <div className="flex justify-between border-t pt-2">
          <div className="h-2 bg-gray-100 rounded w-20" />
          <div className="h-2 bg-gray-100 rounded w-20" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
