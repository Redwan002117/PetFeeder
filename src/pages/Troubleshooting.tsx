import React, { useState } from 'react';
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileText, LifeBuoy, RefreshCw, Terminal, WifiOff, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { testDatabaseConnection } from '@/lib/database-test';
import DatabaseStatus from '@/components/DatabaseStatus';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const TroubleshootingPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("database");
  const [isLoading, setIsLoading] = useState(false);
  const [diagResults, setDiagResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setDiagResults(null);
    
    try {
      // Run database connection test
      const dbTest = await testDatabaseConnection();
      
      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        online: navigator.onLine,
        screenSize: `${window.screen.width}x${window.screen.height}`,
      };
      
      // Get application info
      const appInfo = {
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: import.meta.env.MODE,
        buildTime: new Date().toISOString(),
      };
      
      // Get auth info (safely)
      let authInfo = { loggedIn: false, hasSession: false };
      try {
        const { data } = await supabase.auth.getSession();
        authInfo = {
          loggedIn: !!currentUser,
          hasSession: !!data.session,
        };
      } catch (e) {
        console.error('Error getting auth info:', e);
      }
      
      setDiagResults({
        timestamp: new Date().toISOString(),
        database: dbTest,
        device: deviceInfo,
        app: appInfo,
        auth: authInfo,
      });
      
      toast({
        title: "Diagnostics Complete",
        description: "System diagnostics have been successfully gathered.",
      });
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast({
        title: "Diagnostics Failed",
        description: "An error occurred while running diagnostics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyDiagnostics = () => {
    if (!diagResults) return;
    
    const text = JSON.stringify(diagResults, null, 2);
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copied to Clipboard",
          description: "Diagnostic information has been copied to your clipboard.",
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast({
          title: "Copy Failed",
          description: "Failed to copy diagnostic information. Please try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="container py-8">
      <PageHeader
        title="Troubleshooting"
        description="Diagnose and fix issues with your PetFeeder"
        icon={<HelpCircle className="h-6 w-6" />}
      />

      {!currentUser && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to access the troubleshooting tools.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-3 max-w-md">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="database">
          <DatabaseStatus />
        </TabsContent>

        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <WifiOff className="mr-2 h-5 w-5" />
                Connection Troubleshooting
              </CardTitle>
              <CardDescription>
                Diagnose and fix issues with your device connectivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If you're having trouble connecting your device, try these steps:
                </AlertDescription>
              </Alert>

              <div className="space-y-4 mt-4">
                <h3 className="font-medium">Common Solutions:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Ensure your device is powered on and within range of your WiFi router</li>
                  <li>Check that your WiFi network is operational</li>
                  <li>Verify you're using the correct WiFi credentials</li>
                  <li>Restart your PetFeeder device</li>
                  <li>Try resetting your device to factory settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Terminal className="mr-2 h-5 w-5" />
                System Diagnostics
              </CardTitle>
              <CardDescription>
                Gather system information to help diagnose issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Button 
                  onClick={runDiagnostics} 
                  disabled={isLoading || !currentUser}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Terminal className="mr-2 h-4 w-4" />
                      Run Diagnostics
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={copyDiagnostics} 
                  disabled={!diagResults || isLoading}
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Copy Results
                </Button>
              </div>
              
              {diagResults && (
                <div className="bg-muted rounded-md p-4 overflow-auto max-h-[500px]">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(diagResults, null, 2)}
                  </pre>
                </div>
              )}
              
              {!diagResults && !isLoading && (
                <div className="text-center p-8 text-muted-foreground">
                  <LifeBuoy className="mx-auto h-8 w-8 mb-4 opacity-50" />
                  <p>Run the diagnostic tool to gather system information</p>
                  <p className="text-sm mt-1">This can help identify issues with your PetFeeder setup</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TroubleshootingPage;
