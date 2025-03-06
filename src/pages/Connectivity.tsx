
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wifi, WifiOff, LockKeyhole, AlertCircle, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import { getDeviceStatus, getWifiNetworks, setWifiCredentials } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const Connectivity = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [deviceStatus, setDeviceStatus] = useState<any>({});
  const [wifiNetworks, setWifiNetworks] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const unsubscribeStatus = getDeviceStatus(currentUser.uid, (data) => {
        if (data) {
          setDeviceStatus(data);
        } else {
          setDeviceStatus({});
        }
      });

      const unsubscribeNetworks = getWifiNetworks(currentUser.uid, (data) => {
        if (data) {
          const networksArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setWifiNetworks(networksArray.sort((a, b) => b.signal - a.signal));
        } else {
          setWifiNetworks([]);
        }
      });

      return () => {
        unsubscribeStatus();
        unsubscribeNetworks();
      };
    }
  }, [currentUser]);

  const handleRefreshNetworks = () => {
    if (currentUser) {
      setRefreshing(true);
      // In a real app, you would trigger a scan on the device via Firebase
      // Here we'll simulate it with a timeout
      setTimeout(() => {
        setRefreshing(false);
        toast({
          title: "Networks Refreshed",
          description: "Available Wi-Fi networks have been updated",
        });
      }, 3000);
    }
  };

  const handleConnectWifi = async () => {
    if (currentUser && selectedNetwork) {
      setLoading(true);
      try {
        await setWifiCredentials(currentUser.uid, selectedNetwork, password);
        
        toast({
          title: "Connection Request Sent",
          description: "Your device is attempting to connect to the network",
        });
        
        // Close dialog
        setDialogOpen(false);
        
        // Reset form
        setPassword("");
        setSelectedNetwork(null);
      } catch (error) {
        console.error("Error setting WiFi credentials:", error);
        toast({
          title: "Connection Failed",
          description: "Failed to send connection request to device",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getSignalStrength = (signal: number) => {
    if (signal >= -50) return "Excellent";
    if (signal >= -60) return "Good";
    if (signal >= -70) return "Fair";
    return "Poor";
  };

  const getSignalIcon = (signal: number) => {
    if (signal >= -50) return "••••";
    if (signal >= -60) return "•••·";
    if (signal >= -70) return "••··";
    return "•···";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Device Connectivity</CardTitle>
          <CardDescription>Manage your pet feeder's network connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {deviceStatus.wifiConnected ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">Connection Status</span>
                </div>
                <span className={deviceStatus.wifiConnected ? "text-green-500" : "text-red-500"}>
                  {deviceStatus.wifiConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              
              {deviceStatus.wifiConnected && deviceStatus.currentNetwork && (
                <div className="mt-3 pl-8">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network</span>
                      <span>{deviceStatus.currentNetwork}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address</span>
                      <span>{deviceStatus.ipAddress || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signal</span>
                      <span>{deviceStatus.signalStrength ? `${deviceStatus.signalStrength}dBm` : "Unknown"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!deviceStatus.online && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Device Offline</AlertTitle>
                <AlertDescription>
                  Your pet feeder is currently offline. Make sure it is powered on and within range of your WiFi network.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Available Networks</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshNetworks}
                disabled={refreshing || !deviceStatus.online}
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Refresh className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
            
            {wifiNetworks.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Network Name</TableHead>
                      <TableHead>Security</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wifiNetworks.map((network) => (
                      <TableRow key={network.id} className={deviceStatus.currentNetwork === network.ssid ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Wifi className="h-4 w-4 text-pet-primary" />
                            <span>{network.ssid}</span>
                            {deviceStatus.currentNetwork === network.ssid && (
                              <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {network.secured ? (
                            <div className="flex items-center">
                              <LockKeyhole className="h-3 w-3 mr-1" />
                              <span>Secured</span>
                            </div>
                          ) : (
                            "Open"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span className="font-mono">{getSignalIcon(network.signal)}</span>
                            <span className="text-xs text-muted-foreground">
                              ({getSignalStrength(network.signal)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog open={dialogOpen && selectedNetwork === network.ssid} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) setSelectedNetwork(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedNetwork(network.ssid)}
                                disabled={!deviceStatus.online || deviceStatus.currentNetwork === network.ssid}
                              >
                                {deviceStatus.currentNetwork === network.ssid ? "Connected" : "Connect"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Connect to Wi-Fi</DialogTitle>
                                <DialogDescription>
                                  Enter the password for {selectedNetwork}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="wifi-password">Wi-Fi Password</Label>
                                  <Input
                                    id="wifi-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter network password"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setDialogOpen(false);
                                  setSelectedNetwork(null);
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={handleConnectWifi} disabled={loading || !password}>
                                  {loading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    "Connect"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 border rounded-md">
                <WifiOff className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {refreshing 
                    ? "Scanning for networks..." 
                    : deviceStatus.online 
                      ? "No networks found. Try refreshing." 
                      : "Device is offline. Cannot scan for networks."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Connectivity Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Device Won't Connect</h3>
              <p className="text-sm text-muted-foreground">
                Make sure your pet feeder is powered on and within range of your Wi-Fi router.
                Try moving it closer to improve signal strength.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Connection Keeps Dropping</h3>
              <p className="text-sm text-muted-foreground">
                Check for interference from other devices. Your pet feeder works best with a
                strong, stable Wi-Fi connection.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Can't Find Your Network</h3>
              <p className="text-sm text-muted-foreground">
                The device supports 2.4GHz Wi-Fi networks only. If you have a dual-band router,
                make sure the 2.4GHz band is enabled.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Connectivity;
