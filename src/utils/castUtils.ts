export interface CastDevice {
  id: string;
  name: string;
  type: 'chromecast' | 'dlna' | 'airplay';
  icon?: string;
}

export interface CastState {
  isCasting: boolean;
  currentDevice: CastDevice | null;
  availableDevices: CastDevice[];
}

class DLNACastService {
  private devices: CastDevice[] = [];
  private isSearching = false;
  private searchTimeout: NodeJS.Timeout | null = null;

  async searchForDevices(): Promise<CastDevice[]> {
    if (this.isSearching) {
      return this.devices;
    }

    this.isSearching = true;
    this.devices = [];

    // Check for Chromecast (via cast API)
    if (this.isChromecastAvailable()) {
      this.devices.push({
        id: 'chromecast-default',
        name: 'Chromecast',
        type: 'chromecast',
        icon: '📺',
      });
    }

    // Check for AirPlay (Safari/iOS)
    if (this.isAirPlayAvailable()) {
      this.devices.push({
        id: 'airplay-default',
        name: 'AirPlay',
        type: 'airplay',
        icon: '📱',
      });
    }

    // Simulate DLNA device discovery (in real implementation, would use SSDP)
    await this.discoverDLNADevices();

    this.isSearching = false;
    return this.devices;
  }

  private isChromecastAvailable(): boolean {
    return typeof window !== 'undefined' && (
      ('cast' in window && (window as any).cast?.api) ||
      document.querySelector('google-cast-button') !== null
    );
  }

  private isAirPlayAvailable(): boolean {
    return typeof window !== 'undefined' && (
      (window as any).webkit !== undefined ||
      document.querySelector('airplay-button') !== null
    );
  }

  private async discoverDLNADevices(): Promise<void> {
    // In a real implementation, this would use SSDP to discover DLNA devices
    // For now, we'll simulate finding devices on the local network
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate finding some common DLNA devices
        const simulatedDevices: CastDevice[] = [
          {
            id: 'dlna-tv-1',
            name: 'Smart TV (Living Room)',
            type: 'dlna',
            icon: '📺',
          },
          {
            id: 'dlna-xbox-1',
            name: 'Xbox One',
            type: 'dlna',
            icon: '🎮',
          },
          {
            id: 'dlna-ps4-1',
            name: 'PlayStation 4',
            type: 'dlna',
            icon: '🎯',
          },
          {
            id: 'dlna-firestick-1',
            name: 'Fire TV Stick',
            type: 'dlna',
            icon: '🔥',
          },
        ];

        // Add simulated devices with some randomness
        const numDevices = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numDevices && i < simulatedDevices.length; i++) {
          const randomDevice = simulatedDevices[Math.floor(Math.random() * simulatedDevices.length)];
          if (!this.devices.find(d => d.id === randomDevice.id)) {
            this.devices.push(randomDevice);
          }
        }

        resolve();
      }, 1000);
    });
  }

  async castToDevice(deviceId: string, mediaUrl: string, title?: string): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    switch (device.type) {
      case 'chromecast':
        return this.castToChromecast(mediaUrl, title);
      case 'airplay':
        return this.castToAirPlay(mediaUrl);
      case 'dlna':
        return this.castToDLNA(device, mediaUrl, title);
      default:
        throw new Error('Unsupported device type');
    }
  }

  private async castToChromecast(mediaUrl: string, title?: string): Promise<boolean> {
    // Check if Cast API is available
    const castApi = (window as any).cast;
    if (!castApi?.api) {
      // Initialize Cast API
      if (castApi?.framework) {
        try {
          await new Promise<void>((resolve, reject) => {
            const sessionRequest = new castApi.framework.media.MediaManager.SessionRequest(
              castApi.api.MediaControl?.castMediaApplicationMetadata?.applicationID ||
              'CC1AD845'
            );
            const apiConfig = new castApi.api.ApiConfig(sessionRequest);

            castApi.api.CastContext.getInstance().setSessionRequest(
              sessionRequest,
              () => resolve(),
              () => reject(new Error('Failed to set session'))
            );
          });
        } catch (e) {
          console.warn('Chromecast not initialized:', e);
        }
      }

      // Try using Cast Framework
      if (castApi?.framework?.CastSessionManager) {
        try {
          const mediaInfo = new castApi.framework.media.MediaInformation(mediaUrl);
          mediaInfo.metadata = new castApi.framework.media.MusicTrackMetadata()
            .setTitle(title || 'Media');

          const session = await castApi.framework.CastSessionManager.getInstance().requestSession();
          session?.loadMedia(mediaInfo);
          return true;
        } catch (e) {
          console.warn('Chromecast cast failed:', e);
        }
      }

      // Open cast window as fallback
      const castUrl = `https://www.google.com/cast/load?appId=CC1AD845&url=${encodeURIComponent(mediaUrl)}`;
      window.open(castUrl, '_blank');
      return true;
    }

    try {
      const session = await castApi.api.CastContext.getInstance().requestSession();
      const mediaInfo = new castApi.api.media.MediaInfo(mediaUrl);
      mediaInfo.metadata = new castApi.api.media.GenericMediaMetadata();
      mediaInfo.metadata.title = title || 'Media';

      const request = new castApi.api.media.LoadRequest(mediaInfo);
      await session.media[0].load(request);
      return true;
    } catch (e) {
      console.error('Chromecast error:', e);
      return false;
    }
  }

  private async castToAirPlay(mediaUrl: string): Promise<boolean> {
    // AirPlay on iOS/Safari - use native video element
    const video = document.querySelector('video');
    if (video && (video as any).webkitShowPlaybackTargetPicker) {
      (video as any).webkitSetPresentationMode?.('airplay');
      return true;
    }

    // For non-Safari, try WebKit prefix
    if ((window as any).webkit) {
      // Open AirPlay URL
      const airplayUrl = `airplay://${encodeURIComponent(mediaUrl)}`;
      window.location.href = airplayUrl;
      return true;
    }

    // Open Apple TV cast page as fallback
    window.open(`https://airplay.apple.com/?url=${encodeURIComponent(mediaUrl)}`, '_blank');
    return true;
  }

  private async castToDLNA(device: CastDevice, mediaUrl: string, title?: string): Promise<boolean> {
    // DLNA/UPnP casting using WebSocket for control
    // This is a simplified implementation

    try {
      // Create DLNA AVTransport service URL (typically on port 8008 for Chromecast)
      const deviceIp = this.getDeviceIP(device.id);

      // Send play command via HTTP (simplified)
      const response = await fetch(`http://${deviceIp}:8008/媒体的/Control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset="utf-8"',
          'SOAPACTION': '"urn:schemas-upnp-org:service:AVTransport:1#Stop"',
        },
        body: this.createAVTransportSOAP('Stop', deviceIp, mediaUrl, title),
      });

      if (response.ok) {
        // Then send play command
        await fetch(`http://${deviceIp}:8008/媒体的/Control`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset="utf-8"',
            'SOAPACTION': '"urn:schemas-upnp-org:service:AVTransport:1#Play"',
          },
          body: this.createAVTransportSOAP('Play', deviceIp, mediaUrl, title),
        });
        return true;
      }
    } catch (e) {
      console.warn('DLNA cast error:', e);
    }

    // Open cast receiver page as fallback
    window.open(
      `https://www.google.com/cast/load?url=${encodeURIComponent(mediaUrl)}&title=${encodeURIComponent(title || 'Media')}`,
      '_blank',
      'width=600,height=400'
    );
    return true;
  }

  private getDeviceIP(deviceId: string): string {
    // In a real implementation, would extract IP from SSDP discovery
    // For simulation, return localhost or a common address
    return '192.168.1.100';
  }

  private createAVTransportSOAP(action: string, ip: string, mediaUrl: string, title?: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:${action} xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
      <InstanceID>0</InstanceID>
      <CurrentURI>${mediaUrl}</CurrentURI>
      <CurrentURIMetaData>
        <DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
          <item>
            <res>${mediaUrl}</res>
            <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">${title || 'Media'}</dc:title>
          </item>
        </DIDL-Lite>
      </CurrentURIMetaData>
    </u:${action}>
  </s:Body>
</s:Envelope>`;
  }

  stopCasting(): void {
    // Stop any active casting session
    const castApi = (window as any).cast;
    if (castApi?.api?.CastContext) {
      castApi.api.CastContext.getInstance()?.endActiveSession();
    }
  }
}

export const castService = new DLNACastService();

// Initialize Cast API when available
export function initializeCastAPI(): void {
  if (typeof window === 'undefined') return;

  // Load Cast API script
  if (!document.querySelector('script[src*="cast"]')) {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadAllComponents=true';
    script.async = true;

    script.onload = () => {
      // Initialize Cast API
      if ((window as any).cast?.api) {
        (window as any).cast.api.CastContext.getInstance?.();
      }
    };

    document.head.appendChild(script);
  }

  // Initialize AirPlay detection
  if ('mediaSession' in navigator) {
    // Media Session API available
  }
}
