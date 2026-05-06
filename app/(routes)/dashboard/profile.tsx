"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const mockUser = {
  name: "John Doe",
  email: "john.doe@email.com",
  phone: "+1 234 567 8901",
  age: 29,
  gender: "Male",
  profilePic: "/doctor1.png",
  subscription: {
    plan: "Premium",
    expiry: "2025-12-31",
  },
};

const mockHistory = [
  {
    id: 1,
    specialist: "General Physician",
    description: "Fever and cough",
    date: "2025-07-20",
    report: "View Report",
  },
  {
    id: 2,
    specialist: "Psychologist",
    description: "Stress management",
    date: "2025-06-15",
    report: "View Report",
  },
];

export default function ProfilePage() {
  const [user, setUser] = useState(mockUser);
  const [history] = useState(mockHistory);

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow mt-10">
      <div className="flex items-center gap-6 mb-8">
        <Image
          src={user.profilePic}
          alt="Profile Picture"
          width={80}
          height={80}
          className="rounded-full border"
        />
        <div>
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
          <p className="text-gray-500">{user.phone}</p>
        </div>
        <Button className="ml-auto">Edit Profile</Button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Personal Info</h3>
          <p>Age: {user.age}</p>
          <p>Gender: {user.gender}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Subscription</h3>
          <p>Plan: {user.subscription.plan}</p>
          <p>Expiry: {user.subscription.expiry}</p>
          <Button size="sm" className="mt-2">Upgrade</Button>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-4">Consultation History</h3>
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Specialist</th>
              <th className="p-2">Description</th>
              <th className="p-2">Date</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">{item.specialist}</td>
                <td className="p-2">{item.description}</td>
                <td className="p-2">{item.date}</td>
                <td className="p-2">
                  <Button size="sm" variant="outline">{item.report}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <Button variant="outline">Change Password</Button>
        <Button variant="outline">Notification Settings</Button>
        <Button variant="destructive">Delete Account</Button>
        <Button className="ml-auto">Logout</Button>
      </div>
    </div>
  );
}
