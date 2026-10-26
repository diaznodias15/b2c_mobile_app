import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Vibration, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flashlight, FlashlightOff, ScanBarcode, X } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';
import { BARCODE_TYPES, createConsecutiveReader, MIN_BARCODE_LENGTH, normalizeBarcode } from '@/utils/barcode';

import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { TextField } from '../ui/TextField';
import { Txt } from '../ui/Txt';

/** Marco de enfoque: el código de barras es ancho, no cuadrado. */
const FRAME_HEIGHT = 160;

/**
 * Escáner de código de barras en un modal de pantalla completa. Lee con la cámara trasera
 * (EAN-13/8, UPC-A/E y Code 128) y exige **2 lecturas consecutivas iguales** antes de aceptar un
 * código (ver `utils/barcode.ts`). No hay endpoint propio: `onDetect` recibe el código y quien lo
 * usa lo trata como término de búsqueda.
 *
 * Siempre hay **entrada manual** del código (permiso denegado, sin cámara o código dañado). La
 * cámara solo existe mientras el modal está abierto (solo puede haber una vista previa activa) y
 * se libera al cerrarlo. La linterna se enciende con el botón del visor.
 *
 * El `Toast` global queda tapado por un `Modal` nativo: los avisos van dentro del propio modal.
 */
export function BarcodeScannerModal({
  visible,
  onClose,
  onDetect,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  /** Recibe el código aceptado (ya recortado, ≥3 caracteres). El modal se cierra solo. */
  onDetect: (code: string) => void;
  colors: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [reader] = useState(() => createConsecutiveReader());
  // Evita avisar dos veces: la cámara sigue disparando lecturas hasta que el modal se cierra.
  const doneRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    doneRef.current = false;
    reader.reset();
  }, [visible, reader]);

  // Al abrir se pide el permiso si el sistema todavía deja preguntar.
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) void requestPermission();
    // `requestPermission` es estable; solo importa reaccionar a abrir y al estado del permiso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, permission?.granted, permission?.canAskAgain]);

  const finish = (code: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    Vibration.vibrate(80);
    setTorch(false);
    setManual('');
    setManualError(null);
    onDetect(code);
    onClose();
  };

  const handleClose = () => {
    setTorch(false);
    setManualError(null);
    onClose();
  };

  const handleScanned = (raw: string) => {
    const code = reader.push(raw);
    if (code) finish(code);
  };

  const handleManual = () => {
    const code = normalizeBarcode(manual);
    if (!code) {
      setManualError(`Escribe al menos ${MIN_BARCODE_LENGTH} caracteres.`);
      return;
    }
    finish(code);
  };

  const granted = permission?.granted === true;
  const blocked = permission !== null && !permission.granted && !permission.canAskAgain;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: insets.top + 8,
            paddingBottom: 8,
            backgroundColor: colors.productCard,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Txt variant="section" colors={colors}>
              Escanear código de barras
            </Txt>
            <Txt variant="caption" color="muted" colors={colors}>
              Apunta al código del empaque
            </Txt>
          </View>
          <IconButton icon={X} label="Cerrar" onPress={handleClose} variant="plain" colors={colors} />
        </View>

        <View style={{ flex: 1, padding: 16, gap: 16 }}>
          <View
            style={{
              flex: 1,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#000000',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {visible && granted && !cameraError ? (
              <>
                <CameraView
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  facing="back"
                  enableTorch={torch}
                  barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
                  onBarcodeScanned={({ data }) => handleScanned(data)}
                  onMountError={() => setCameraError('No pudimos abrir la cámara.')}
                />
                <View
                  pointerEvents="none"
                  style={{
                    width: '82%',
                    height: FRAME_HEIGHT,
                    borderRadius: 16,
                    borderWidth: 3,
                    borderColor: '#FFFFFF',
                  }}
                />
                <View style={{ position: 'absolute', right: 8, bottom: 8 }}>
                  <IconButton
                    icon={torch ? FlashlightOff : Flashlight}
                    label={torch ? 'Apagar linterna' : 'Encender linterna'}
                    onPress={() => setTorch((t) => !t)}
                    variant="filled"
                    colors={colors}
                  />
                </View>
              </>
            ) : (
              <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
                <ScanBarcode size={44} color="#FFFFFF" strokeWidth={1.5} />
                <Txt variant="body" style={{ color: '#FFFFFF', textAlign: 'center' }} colors={colors}>
                  {cameraError
                    ? cameraError
                    : permission === null
                      ? 'Preparando la cámara…'
                      : blocked
                        ? 'La cámara está desactivada para la app. Actívala en los ajustes o escribe el código.'
                        : 'Necesitamos la cámara para leer el código de barras. También puedes escribirlo.'}
                </Txt>
                {permission !== null && !granted ? (
                  <Button
                    label={blocked ? 'Abrir ajustes' : 'Permitir cámara'}
                    fullWidth={false}
                    variant="secondary"
                    onPress={() => (blocked ? void Linking.openSettings() : void requestPermission())}
                    colors={colors}
                  />
                ) : null}
              </View>
            )}
          </View>

          <View style={{ gap: 8, paddingBottom: insets.bottom }}>
            <TextField
              label="¿Sin cámara? Escribe el código"
              value={manual}
              onChangeText={(text) => {
                setManual(text);
                if (manualError) setManualError(null);
              }}
              keyboardType="number-pad"
              returnKeyType="search"
              onSubmitEditing={handleManual}
              error={manualError}
              colors={colors}
            />
            <Button label="Buscar código" onPress={handleManual} disabled={manual.trim().length === 0} colors={colors} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
