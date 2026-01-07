"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { client } from "@/lib/orpc";

import React, { FormEvent, useState } from "react";

const ORPCDemo = () => {
  const [result, setResult] = useState<string>();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const name = form.get("name") as string;
    const res = await client.hello({ name });
    setResult(res);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simple Post Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex items-end gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input type="text" name="name" defaultValue={"James"} required />
          </div>

          <Button>Send</Button>
        </form>
        <div className="text-bold text-2xl bg-amber-700">{result}</div>
      </CardContent>
    </Card>
  );
};

export default ORPCDemo;
