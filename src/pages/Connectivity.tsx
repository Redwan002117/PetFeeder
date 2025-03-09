import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wifi, Signal, RefreshCw, WifiOff, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getWifiNetworks, setWifiCredentials, getDeviceStatus } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";

interface WifiNetwork {
  ssid: string;
  strength: string;
  secured: boolean;
}

interface ConnectivityProps {
  standalone?: boolean;
}

const Connectivity = ({ standalone = true }: ConnectivityProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Use our safe getWifiNetworks function
      const unsubscribe = getWifiNetworks(currentUser.uid, (data) => {
        setLoading(false);
        if (data && data.networks) {
          setNetworks(data.networks);
        } else {
          // Provide default networks if none are available
          setNetworks([
            { ssid: 'WiFi Network 1', strength: 'Strong', secured: true },
            { ssid: 'WiFi Network 2', strength: 'Medium', secured: true },
            { ssid: 'WiFi Network 3', strength: 'Weak', secured: false }
          ]);
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error("Error loading WiFi networks:", error);
      setLoading(false);
      setError("Failed to load WiFi networks. Please try again later.");
      
      // Provide default networks if there's an error
      setNetworks([
        { ssid: 'WiFi Network 1', strength: 'Strong', secured: true },
        { ssid: 'WiFi Network 2', strength: 'Medium', secured: true },
        { ssid: 'WiFi Network 3', strength: 'Weak', secured: false }
      ]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      getDeviceStatus(currentUser.uid, (status) => {
        setDeviceStatus(status);
        setIsConnected(status?.online);
      });
    }
  }, [currentUser]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate a delay before getting new data
    setTimeout(() => {
      if (currentUser) {
        getWifiNetworks(currentUser.uid, (data) => {
          if (data) {
            const networksArray = Object.keys(data).map(key => ({
              id: key,
              ssid: data[key].ssid,
              strength: data[key].strength,
              secured: data[key].secured
            }));
            setNetworks(networksArray);
          }
        });
      }
      setIsRefreshing(false);
    }, 1500);
  };

  const handleNetworkSelect = (ssid: string) => {
    setSelectedNetwork(ssid);
    setPassword("");
  };

  const handleConnect = async () => {
    if (!currentUser || !selectedNetwork) return;

    setConnecting(true);
    try {
      const network = networks.find(n => n.ssid === selectedNetwork);
      if (network && network.secured && !password) {
        toast({
          title: "Password Required",
          description: "Please enter the password for this network.",
          variant: "destructive",
        });
        setConnecting(false);
        return;
      }

      // Use our safe setWifiCredentials function
      await setWifiCredentials(currentUser.uid, selectedNetwork, password);
      
      toast({
        title: "Success",
        description: `Connected to ${selectedNetwork}`,
        variant: "default",
      });
      
      setSelectedNetwork(null);
      setPassword("");
    } catch (error) {
      console.error("Error connecting to WiFi:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the selected network. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const renderNetworkStrength = (strength?: string) => {
    // Handle undefined or null strength values
    if (!strength) {
      return <WifiOff className="h-5 w-5 text-gray-500" />;
    }
    
    switch (strength.toLowerCase()) {
      case 'strong':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'medium':
        return <Wifi className="h-5 w-5 text-yellow-500" />;
      case 'weak':
        return <Wifi className="h-5 w-5 text-red-500" />;
      default:
        return <WifiOff className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      {standalone && (
        <PageHeader
          title="Device Connectivity"
          icon={<Wifi size={28} />}
          description="Manage your device's network connections"
        />
      )}
      {!standalone && (
        <h1 className="text-3xl font-bold mb-6">Device Connectivity</h1>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Signal className="mr-2 h-5 w-5" />
              Device Status
            </CardTitle>
            <CardDescription>Current status of your pet feeder device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${deviceStatus?.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {deviceStatus?.online ? 'Online' : 'Offline'}
                </span>
              </div>
              {deviceStatus?.lastSeen && (
                <div key="last-seen" className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Seen:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(deviceStatus.lastSeen).toLocaleString()}
                  </span>
                </div>
              )}
              {deviceStatus?.batteryLevel !== undefined && (
                <div key="battery-level" className="flex justify-between items-center">
                  <span className="text-sm font-medium">Battery Level:</span>
                  <span className="text-sm text-gray-600">
                    {deviceStatus.batteryLevel}%
                  </span>
                </div>
              )}
              {deviceStatus?.firmwareVersion && (
                <div key="firmware-version" className="flex justify-between items-center">
                  <span className="text-sm font-medium">Firmware:</span>
                  <span className="text-sm text-gray-600">
                    {deviceStatus.firmwareVersion}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="mr-2 h-5 w-5" />
              WiFi Connection
            </CardTitle>
            <CardDescription>Current WiFi connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {deviceStatus?.wifiName && (
                <div key="wifi-name" className="flex justify-between items-center">
                  <span className="text-sm font-medium">Network:</span>
                  <span className="text-sm text-gray-600">
                    {deviceStatus.wifiName}
                  </span>
                </div>
              )}
              {deviceStatus?.ipAddress && (
                <div key="ip-address" className="flex justify-between items-center">
                  <span className="text-sm font-medium">IP Address:</span>
                  <span className="text-sm text-gray-600">
                    {deviceStatus.ipAddress}
                  </span>
                </div>
              )}
              {deviceStatus?.signalStrength && (
                <div key="signal-strength" className="flex justify-between items-center">
                  <span className="text-sm font-medium">Signal Strength:</span>
                  <span className="text-sm text-gray-600 flex items-center">
                    {renderNetworkStrength(deviceStatus.signalStrength)}
                    <span className="ml-1">{deviceStatus.signalStrength}%</span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Available Networks</CardTitle>
            <CardDescription>Select a WiFi network to connect your device</CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-2"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Scanning for networks...</span>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                {networks.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No networks found</p>
                ) : (
                  networks.map((network) => (
                    <div
                      key={network.ssid}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        selectedNetwork === network.ssid ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                      onClick={() => handleNetworkSelect(network.ssid)}
                    >
                      <div className="flex items-center">
                        {renderNetworkStrength(network.strength)}
                        <span className="ml-2">{network.ssid}</span>
                      </div>
                      {network.secured && <Lock className="h-4 w-4 text-gray-500" />}
                    </div>
                  ))
                )}
              </div>

              {selectedNetwork && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Connect to {selectedNetwork}</h3>
                    
                    {networks.find(n => n.ssid === selectedNetwork)?.secured && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter network password"
                        />
                      </div>
                    )}
                    
                    <div className="flex space-x-2 mt-4">
                      <Button
                        onClick={handleConnect}
                        disabled={connecting}
                      >
                        {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Connect
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedNetwork(null)}
                        disabled={connecting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Connectivity;
