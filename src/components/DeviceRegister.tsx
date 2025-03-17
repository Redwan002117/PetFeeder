import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { claimDevice } from '@/lib/device-api';
import { useToast } from '@/hooks/use-toast';

export const DeviceRegister: React.FC = () => {
  const [macAddress, setMacAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Format MAC address as user types
  const handleMacInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9A-F]/gi, '').toUpperCase();
    
    // Format with colons
    if (value.length > 0) {
      value = value.match(/.{1,2}/g)?.join(':') || value;
    }
    
    // Max length with colons is 17 (12 chars + 5 colons)
    if (value.length <= 17) {
      setMacAddress(value);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Clean up MAC address format
      const cleanMac = macAddress.replace(/:/g, '');
      
      if (cleanMac.length !== 12) {
        throw new Error('Please enter a valid MAC address (12 characters)');
      }
      
      await claimDevice(cleanMac);
      
      setSuccess(true);
      setMacAddress('');
      
      toast({
        title: 'Device Registered',
        description: 'Your device has been successfully registered and is now linked to your account.',
      });
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      
      toast({
        title: 'Registration Failed',
        description: err.message || 'Failed to register device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Device</CardTitle>
        <CardDescription>
          Link a new PetFeeder device to your account by entering its MAC address
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4 border-green-500 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Device has been registered successfully and is now linked to your account.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert className="mb-4 border-red-500 text-red-500" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="macAddress">Device MAC Address</Label>
              <Input
                id="macAddress"
                placeholder="Example: 4C:11:AE:B3:A8:04"
                value={macAddress}
                onChange={handleMacInput}
                disabled={loading}
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">
                The MAC address is printed on a sticker on the back of your PetFeeder device
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || macAddress.length < 12}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Device'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DeviceRegister;
