import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserGuide } from './UserGuide';
import { AdminGuide } from './AdminGuide';
import { ESP32Guide } from './ESP32Guide';
import { Book, Shield, Cpu } from "lucide-react";

export const Documentation = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">PetFeeder Hub Documentation</h1>
        <p className="text-gray-700">
          Welcome to the comprehensive documentation for the PetFeeder Hub system.
          Choose a section below to learn more about using and managing your automated pet feeding solution.
        </p>
      </div>

      <Tabs defaultValue="user-guide" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="user-guide" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            <span>User Guide</span>
          </TabsTrigger>
          <TabsTrigger value="admin-guide" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Admin Guide</span>
          </TabsTrigger>
          <TabsTrigger value="esp32-guide" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>ESP32 Guide</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-guide" className="mt-6">
          <UserGuide />
        </TabsContent>

        <TabsContent value="admin-guide" className="mt-6">
          <AdminGuide />
        </TabsContent>

        <TabsContent value="esp32-guide" className="mt-6">
          <ESP32Guide />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 