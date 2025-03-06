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
import { Wifi, Signal, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getWifiNetworks, setWifiCredentials, getDeviceStatus } from "@/lib/firebase";

const Connectivity = () => {
  const { currentUser } = useAuth();
  const [networks, setNetworks] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wifiPassword, setWifiPassword] = useState("");

  useEffect(() => {
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

  const handleConnect = (ssid) => {
    if (currentUser) {
      setWifiCredentials(currentUser.uid, ssid, wifiPassword)
        .then(() => {
          setWifiPassword("");
          handleRefresh();
        });
    }
  };

  const renderNetworkStrength = (strength) => {
    if (strength > 75) return "🌟";
    if (strength > 50) return "⭐";
    if (strength > 25) return "✨";
    return "⚪";
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Device Connectivity</h1>
      
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
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Seen:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(deviceStatus.lastSeen).toLocaleString()}
                  </span>
                </div>
              )}
              {deviceStatus?.batteryLevel !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Battery Level:</span>
                  <span className="text-sm text-gray-600">
                    {deviceStatus.batteryLevel}%
                  </span>
                </div>
              )}
              {deviceStatus?.firmwareVersion && (
                <div className="flex justify-between items-center">
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
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Network:</span>
                  <span className="text-sm text-gray-600">
                    {deviceStatus.wifiName}
                  </span>
                </div>
              )}
              {deviceStatus?.ipAddress && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">IP Address:</span>
                  <span className="text-sm text-gray-600">
                    {deviceStatus.ipAddress}
                  </span>
                </div>
              )}
              {deviceStatus?.signalStrength && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Signal Strength:</span>
                  <span className="text-sm text-gray-600 flex items-center">
                    {renderNetworkStrength(deviceStatus.signalStrength)}
                    {deviceStatus.signalStrength}%
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network Name</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Security</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {networks.length > 0 ? (
                networks.map((network) => (
                  <TableRow key={network.id}>
                    <TableCell className="font-medium">{network.ssid}</TableCell>
                    <TableCell>{renderNetworkStrength(network.strength)}</TableCell>
                    <TableCell>{network.secured ? '🔒 Secured' : '🔓 Open'}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">Connect</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Connect to {network.ssid}</DialogTitle>
                            <DialogDescription>
                              Enter the WiFi password to connect your pet feeder to this network.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">Password</label>
                            <Input 
                              type="password" 
                              placeholder="WiFi password" 
                              value={wifiPassword}
                              onChange={(e) => setWifiPassword(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => handleConnect(network.ssid)} 
                              disabled={network.secured && !wifiPassword}
                            >
                              Connect Device
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    {isRefreshing ? 'Scanning for networks...' : 'No WiFi networks found. Click refresh to scan again.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Connectivity;
