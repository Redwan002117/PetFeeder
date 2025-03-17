import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Wifi, Shield, Server } from 'lucide-react';
import { testDatabaseConnection, DatabaseTestResult } from '@/lib/database-test';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const DatabaseStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<DatabaseTestResult | null>(null);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const runTest = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to test the database connection.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await testDatabaseConnection();
      setTestResult(result);
      
      // Fetch Supabase project info
      try {
        const { data } = await supabase.rpc('get_project_info');
        setProjectInfo(data);
      } catch (error) {
        console.error('Failed to fetch project info:', error);
      }
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Issues Detected",
        description: result.success 
          ? `Database connection is healthy (${result.latency}ms)`
          : `Some issues were detected with your database connection.`,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Test Failed",
        description: "An unexpected error occurred while testing the database connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) runTest();
  }, [currentUser]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Database Connection Status
        </CardTitle>
        <CardDescription>
          Test and diagnose your connection to the Supabase database
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!testResult && !isLoading && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Click the button below to test your connection to the database.
            </AlertDescription>
          </Alert>
        )}
        
        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant={testResult.success ? "default" : "destructive"} className="mr-2">
                  {testResult.success ? "HEALTHY" : "ISSUES DETECTED"}
                </Badge>
                <span>Overall Status</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {testResult.latency}ms
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${testResult.connectionOk ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <Wifi className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Connection</span>
                <span className="ml-auto">
                  {testResult.connectionOk 
                    ? <CheckCircle className="h-4 w-4 text-green-500" /> 
                    : <XCircle className="h-4 w-4 text-red-500" />}
                </span>
              </div>
              
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${testResult.authOk ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Authentication</span>
                <span className="ml-auto">
                  {testResult.authOk 
                    ? <CheckCircle className="h-4 w-4 text-green-500" /> 
                    : <XCircle className="h-4 w-4 text-red-500" />}
                </span>
              </div>
              
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${testResult.missingTables.length === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Schema</span>
                <span className="ml-auto">
                  {testResult.missingTables.length === 0
                    ? <CheckCircle className="h-4 w-4 text-green-500" /> 
                    : <XCircle className="h-4 w-4 text-red-500" />}
                </span>
              </div>
            </div>
            
            {testResult.missingTables.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Missing tables detected: {testResult.missingTables.join(", ")}
                </AlertDescription>
              </Alert>
            )}
            
            {projectInfo && (
              <div className="text-sm text-muted-foreground">
                <p>Project: {projectInfo.name}</p>
                <p>Region: {projectInfo.region}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={runTest} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseStatus;
