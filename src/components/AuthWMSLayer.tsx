import { createTileLayerComponent, updateGridLayer, withPane } from '@react-leaflet/core';
import L from 'leaflet';
import type { WMSTileLayerProps } from 'react-leaflet';

export interface AuthWMSTileLayerProps extends WMSTileLayerProps {
  authToken?: string | null;
}

const AuthWMSTileLayerClass = L.TileLayer.WMS.extend({
  createTile(coords: L.Coords, done: L.DoneCallback) {
    const url = this.getTileUrl(coords);
    const img = document.createElement('img');
    img.alt = '';
    img.setAttribute('role', 'presentation');

    const headers = new Headers();
    if (this.options.authToken) {
      headers.append('Authorization', `Basic ${this.options.authToken}`);
    }

    fetch(url, { headers })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        img.src = objectUrl;
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          done(undefined, img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          done(new Error('Image load error'), img);
        };
      })
      .catch(error => {
        done(error, img);
      });

    return img;
  }
});

export const AuthWMSTileLayer = createTileLayerComponent<
  L.TileLayer.WMS,
  AuthWMSTileLayerProps
>(
  function createWMSTileLayer({ url, authToken, ...options }, context) {
    return {
      instance: new (AuthWMSTileLayerClass as any)(url, { ...withPane(options, context), authToken } as any) as L.TileLayer.WMS,
      context,
    };
  },
  function updateWMSTileLayer(layer, props, prevProps) {
    updateGridLayer(layer, props, prevProps);

    if (props.params != null && props.params !== prevProps.params) {
      layer.setParams(props.params);
    }
  }
);
