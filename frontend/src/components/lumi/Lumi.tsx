import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LumiState, ClarityMode } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { lumiImages } from './LumiAssets';
import { useBreathing } from './animations/useBreathing';
import { useListeningRings } from './animations/useListeningRings';
import { useProcessingOrbit } from './animations/useProcessingOrbit';
import { useSpeakingGlow } from './animations/useSpeakingGlow';

interface LumiProps {
  state: LumiState;
  clarityMode: ClarityMode;
  audioAmplitude?: number;
}

const IMAGE_SIZE = Platform.select({ web: 160, default: 140 });
const RING_BASE_SIZE = IMAGE_SIZE + 40;

const stateImageMap: Record<LumiState, keyof typeof lumiImages> = {
  idle: 'idle',
  listening: 'listening',
  processing: 'processing',
  speaking: 'speaking',
  grounding: 'grounding',
  crisis: 'idle',
};

export default function Lumi({ state, clarityMode, audioAmplitude = 0 }: LumiProps) {
  const theme = useTheme();

  // Breathing: active for idle and grounding
  const breathingActive = state === 'idle' || state === 'grounding';
  const { bodyStyle: breathingBodyStyle, glowStyle: breathingGlowStyle } =
    useBreathing(breathingActive);

  // Listening rings
  const { ring1Style, ring2Style, ring3Style } = useListeningRings(
    audioAmplitude,
    state === 'listening',
  );

  // Processing orbit
  const { orbitStyle } = useProcessingOrbit(state === 'processing');

  // Speaking glow
  const { containerStyle: speakingContainerStyle, glowStyle: speakingGlowStyle } =
    useSpeakingGlow(state === 'speaking');

  const imageSource = lumiImages[stateImageMap[state]];

  // Determine which animated wrapper style to use
  const getContainerAnimatedStyle = () => {
    switch (state) {
      case 'idle':
        return breathingBodyStyle;
      case 'grounding':
        return breathingBodyStyle;
      case 'speaking':
        return speakingContainerStyle;
      default:
        return undefined;
    }
  };

  const containerAnimatedStyle = getContainerAnimatedStyle();

  // Grounding: slower/smaller scale handled by wrapping style
  const groundingStaticStyle =
    state === 'grounding' ? { transform: [{ scale: 0.85 }] } : undefined;

  // Crisis: dimmed, no animations
  const crisisStaticStyle =
    state === 'crisis'
      ? { opacity: 0.35 }
      : undefined;

  // Processing: reduced body opacity
  const processingStaticStyle =
    state === 'processing' ? { opacity: 0.55 } : undefined;

  const renderGlowRing = () => {
    if (state === 'idle' || state === 'grounding') {
      return (
        <Animated.View
          style={[
            styles.glowRing,
            {
              borderColor: theme.colors.brandGlow,
              width: RING_BASE_SIZE,
              height: RING_BASE_SIZE,
              borderRadius: RING_BASE_SIZE / 2,
            },
            breathingGlowStyle,
          ]}
        />
      );
    }
    if (state === 'speaking') {
      return (
        <Animated.View
          style={[
            styles.glowRing,
            {
              borderColor: theme.colors.brandGlow,
              width: RING_BASE_SIZE,
              height: RING_BASE_SIZE,
              borderRadius: RING_BASE_SIZE / 2,
              borderWidth: 3,
            },
            speakingGlowStyle,
          ]}
        />
      );
    }
    return null;
  };

  const renderListeningRings = () => {
    if (state !== 'listening') return null;
    const ringConfigs = [
      { style: ring1Style, size: RING_BASE_SIZE },
      { style: ring2Style, size: RING_BASE_SIZE + 24 },
      { style: ring3Style, size: RING_BASE_SIZE + 48 },
    ];
    return ringConfigs.map((ring, index) => (
      <Animated.View
        key={`listening-ring-${index}`}
        style={[
          styles.listeningRing,
          {
            width: ring.size,
            height: ring.size,
            borderRadius: ring.size / 2,
            borderColor: theme.colors.brandPrimary,
          },
          ring.style,
        ]}
      />
    ));
  };

  const renderProcessingOrbit = () => {
    if (state !== 'processing') return null;
    const orbitRadius = RING_BASE_SIZE / 2 + 4;
    const svgSize = orbitRadius * 2 + 20;
    const center = svgSize / 2;

    return (
      <Animated.View
        style={[
          styles.orbitContainer,
          { width: svgSize, height: svgSize },
          orbitStyle,
        ]}
      >
        <Svg width={svgSize} height={svgSize}>
          {/* Dashed circle track */}
          <Circle
            cx={center}
            cy={center}
            r={orbitRadius}
            stroke={theme.colors.brandGlow}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            fill="none"
          />
        </Svg>
        {/* Amber orbiting dot */}
        <View
          style={[
            styles.orbitDot,
            {
              backgroundColor: theme.colors.accentAmber,
              top: center - orbitRadius - 5,
              left: center - 5,
            },
          ]}
        />
      </Animated.View>
    );
  };

  const renderCrisisRing = () => {
    if (state !== 'crisis') return null;
    return (
      <View
        style={[
          styles.crisisRing,
          {
            width: RING_BASE_SIZE + 8,
            height: RING_BASE_SIZE + 8,
            borderRadius: (RING_BASE_SIZE + 8) / 2,
            borderColor: theme.colors.crisisBorder,
          },
        ]}
      />
    );
  };

  const imageElement = (
    <Animated.Image
      source={imageSource}
      style={[
        styles.image,
        { width: IMAGE_SIZE, height: IMAGE_SIZE },
        processingStaticStyle,
        crisisStaticStyle,
      ]}
      resizeMode="contain"
    />
  );

  return (
    <View style={styles.wrapper}>
      {renderGlowRing()}
      {renderListeningRings()}
      {renderProcessingOrbit()}
      {renderCrisisRing()}
      {containerAnimatedStyle ? (
        <Animated.View style={[groundingStaticStyle, containerAnimatedStyle]}>
          {imageElement}
        </Animated.View>
      ) : (
        <View style={groundingStaticStyle}>{imageElement}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    // width and height set inline
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  listeningRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  orbitContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  crisisRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});
