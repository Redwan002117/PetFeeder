import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserGuide } from '@/components/documentation/UserGuide';
import { AdminGuide } from '@/components/documentation/AdminGuide';
import { ESP32Guide } from '@/components/documentation/ESP32Guide';
import { APIGuide } from '@/components/documentation/APIGuide';
import Layout from '@/components/Layout';

export default function Documentation() {
  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">PetFeeder Documentation</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Welcome to the PetFeeder documentation. Here you'll find comprehensive guides for using and managing your PetFeeder device.
          </p>
        </div>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="user">User Guide</TabsTrigger>
            <TabsTrigger value="admin">Admin Guide</TabsTrigger>
            <TabsTrigger value="esp32">ESP32 Guide</TabsTrigger>
            <TabsTrigger value="api">API Guide</TabsTrigger>
          </TabsList>
          <TabsContent value="user">
            <UserGuide />
          </TabsContent>
          <TabsContent value="admin">
            <AdminGuide />
          </TabsContent>
          <TabsContent value="esp32">
            <ESP32Guide />
          </TabsContent>
          <TabsContent value="api">
            <APIGuide />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 