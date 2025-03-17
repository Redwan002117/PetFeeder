import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDevices } from '@/hooks/useDevices';
import { Wifi, WifiOff, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const DeviceWiFiConfig = () => {
  const { devices, loading, updateDevice } = useDevices();
  const device = devices[0]; // Get the first device or adjust as needed
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [networkType, setNetworkType] = useState("wpa2");
  const [connecting, setConnecting] = useState(false);
  const [networks, setNetworks] = useState<string[]>([]);
  const [scanningNetworks, setScanningNetworks] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Function to trigger a WiFi scan
  const scanNetworks = async () => {
    setScanningNetworks(true);
    try {
      // This would be a real API call in production
      // For now, let's simulate a network scan
      
      setTimeout(() => {
        setNetworks([
          "Home_WiFi",
          "Neighbor's Network",
          "Guest Network",
          "IoT_Network",
          "5G_WiFi_2.4"
        ]);
        setScanningNetworks(false);
      }, 2000);
    } catch (error) {
      console.error("Error scanning networks:", error);
      toast({
        title: "Scan Error",
        description: "Failed to scan for WiFi networks. Please try again.",
        variant: "destructive"
      });
      setScanningNetworks(false);
    }
  };

  // Function to connect to WiFi network
  const connectToWifi = async () => {
    if (!ssid) {
      toast({
        title: "Error",
        description: "Please select or enter a network name.",
        variant: "destructive"
      });
      return;
    }

    setConnecting(true);
    try {
      // Set WiFi credentials through Supabase API
      const { error } = await supabase
        .from('device_commands')
        .insert({
          device_id: device.id,
          command_type: 'set_wifi',
          parameters: { ssid, password, type: networkType },
          status: 'pending',
          created_at: new Date().toISOString(),
          created_by: currentUser?.id
        });
      
      if (error) throw error;
      
      // Update local device status
      await updateDevice(device.id, {
        status: "connecting_wifi"
      });
      
      // Show success message
      toast({
        title: "WiFi Connecting",
        description: "Your device is now connecting to the WiFi network.",
      });
      
      setSuccess(true);
      
      // Reset success message after a few seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error connecting to WiFi:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to WiFi network. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  // If loading or no device found
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="py-6 text-center">
        <WifiOff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Device Found</h3>
        <p className="text-muted-foreground">
          Register a device first to configure WiFi settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">WiFi Configuration</h3>
          <p className="text-muted-foreground">
            Configure your device's WiFi connection
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={scanNetworks}
          disabled={scanningNetworks}
        >
          {scanningNetworks ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wifi className="mr-2 h-4 w-4" />
          )}
          {scanningNetworks ? "Scanning..." : "Scan Networks"}
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="ssid">Network Name (SSID)</Label>
          {networks.length > 0 ? (
            <Select value={ssid} onValueChange={setSsid}>
              <SelectTrigger id="ssid">
                <SelectValue placeholder="Select a network" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((network) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Network...</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="ssid"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="Enter network name"
            />
          )}
        </div>
        
        {ssid === "custom" && (
          <div className="grid w-full gap-1.5">
            <Label htmlFor="custom-ssid">Custom Network Name</Label>
            <Input
              id="custom-ssid"
              value=""
              onChange={(e) => setSsid(e.target.value)}
              placeholder="Enter custom network name"
            />
          </div>
        )}
        
        <div className="grid w-full gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter network password"
          />
        </div>
        
        <div className="grid w-full gap-1.5">
          <Label htmlFor="network-type">Security Type</Label>
          <Select value={networkType} onValueChange={setNetworkType}>
            <SelectTrigger id="network-type">
              <SelectValue placeholder="Select security type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wpa2">WPA2 (Recommended)</SelectItem>
              <SelectItem value="wpa">WPA</SelectItem>
              <SelectItem value="wep">WEP (Less Secure)</SelectItem>
              <SelectItem value="none">None (Open Network)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          className="w-full"
          onClick={connectToWifi}
          disabled={connecting || !ssid}
        >
          {connecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : success ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Wifi className="mr-2 h-4 w-4" />
          )}
          {connecting ? "Connecting..." : success ? "Connected!" : "Connect to WiFi"}
        </Button>
      </div>
    </div>
  );
};

export default DeviceWiFiConfig;