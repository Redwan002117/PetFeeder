import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDevice } from '@/contexts/DeviceContext';

export const DeviceWiFiConfig: React.FC = () => {
  const { device, loading, updateWiFiConfig } = useDevice();
  const [config, setConfig] = useState({
    ssid: '',
    password: '',
    hotspotEnabled: false,
    hotspotName: '',
    hotspotPassword: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device?.wifiConfig) {
      setConfig(device.wifiConfig);
    }
  }, [device?.wifiConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWiFiConfig(config);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pet-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WiFi Configuration</CardTitle>
        <CardDescription>Configure network settings for your device</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Primary Network</h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="ssid">WiFi SSID</Label>
                  <Input
                    id="ssid"
                    value={config.ssid}
                    onChange={(e) => setConfig({ ...config, ssid: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">WiFi Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Hotspot Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hotspot"
                    checked={config.hotspotEnabled}
                    onCheckedChange={(checked) => setConfig({ ...config, hotspotEnabled: checked })}
                  />
                  <Label htmlFor="hotspot">Enable Hotspot Mode</Label>
                </div>

                {config.hotspotEnabled && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="hotspotName">Hotspot Name</Label>
                      <Input
                        id="hotspotName"
                        value={config.hotspotName}
                        onChange={(e) => setConfig({ ...config, hotspotName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hotspotPassword">Hotspot Password</Label>
                      <Input
                        id="hotspotPassword"
                        type="password"
                        value={config.hotspotPassword}
                        onChange={(e) => setConfig({ ...config, hotspotPassword: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              The device will create a hotspot automatically if it cannot connect to the primary network.
              You can connect to the hotspot to reconfigure WiFi settings.
            </AlertDescription>
          </Alert>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 