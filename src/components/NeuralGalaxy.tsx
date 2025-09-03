import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle, Group, vec, Line } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { theme } from '../constants';

const { colors } = theme.foundations;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper function to generate random number in a range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Neural Galaxy Configuration
const NUM_NODES = 40;
const CONNECTION_PROBABILITY = 0.1;
// Default, but we'll compute per-container later
const DEFAULT_MAX_CONNECTION_DISTANCE = screenWidth * 0.3;

interface Node {
  id: number;
  x: number;
  y: number;
  initialRadius: number;
  initialOpacity: number;
}

interface Connection {
  id: string;
  from: Node;
  to: Node;
}

interface NeuralGalaxyProps {
  nodeCount?: number;
  exclusionZone?: {
    height: number;
    width: number;
    offsetY?: number;
  };
  animationDuration?: number;
  cycleDuration?: number;
}

// AnimatedNode Component
interface AnimatedNodeProps {
  node: Node;
  isActive: boolean;
  flickerProgress: { value: number };
}

function AnimatedNode({ node, isActive, flickerProgress }: AnimatedNodeProps) {
  const { x, y, initialRadius, initialOpacity } = node;

  const isActiveSV = useSharedValue(isActive);
  
  useEffect(() => {
    isActiveSV.value = isActive;
  }, [isActive, isActiveSV]);

  const opacity = useDerivedValue(() => {
    const flickerFactor = (1 + Math.sin(flickerProgress.value * Math.PI * 2 + x * 0.1)) / 2;
    const base = isActiveSV.value ? Math.min(initialOpacity + 0.3, 0.9) : initialOpacity;
    return base * 0.8 + flickerFactor * (base - base * 0.8);
  }, [x, initialOpacity]);

  const radius = useDerivedValue(() => {
    const flickerFactor = (1 + Math.sin(flickerProgress.value * Math.PI * 2 + x * 0.1)) / 2;
    const base = isActiveSV.value ? initialRadius + 1 : initialRadius;
    return base * 0.9 + flickerFactor * (base - base * 0.9);
  }, [x, initialRadius]);

  return (
    <Circle
      cx={x}
      cy={y}
      r={radius}
      color={colors.galaxyNode || 'rgba(255, 255, 255, 0.8)'}
      opacity={opacity}
    />
  );
}

// AnimatedConnection Component
interface AnimatedConnectionProps {
  connection: Connection;
  isActivePath: boolean;
  flickerProgress: { value: number };
}

function AnimatedConnection({ connection, isActivePath, flickerProgress }: AnimatedConnectionProps) {
  const { from, to } = connection;

  const isActiveSV = useSharedValue(isActivePath);
  
  useEffect(() => {
    isActiveSV.value = isActivePath;
  }, [isActivePath, isActiveSV]);

  const opacity = useDerivedValue(() => {
    if (!isActiveSV.value) return 0.15;
    const pulse = (1 + Math.sin(flickerProgress.value * Math.PI * 2)) / 2;
    return 0.4 + pulse * 0.3;
  }, []);

  const strokeWidth = useDerivedValue(() => (isActiveSV.value ? 1.5 : 1), []);

  const p1 = vec(from.x, from.y);
  const p2 = vec(to.x, to.y);

  return (
    <Line
      p1={p1}
      p2={p2}
      strokeWidth={strokeWidth}
      color={colors.galaxyConnection || 'rgba(255, 255, 255, 0.6)'}
      opacity={opacity}
    />
  );
}

// Main NeuralGalaxy Component
export function NeuralGalaxy({ 
  nodeCount = NUM_NODES,
  exclusionZone = {
    height: screenHeight * 0.25,
    width: screenWidth * 0.85,
    offsetY: -20
  },
  animationDuration = 1500,
  cycleDuration = 2000
}: NeuralGalaxyProps) {
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const flickerProgress = useSharedValue(0);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Generate nodes and connections with error handling
  // Stabilize exclusionZone values to avoid regenerating on every render
  const stableExclusion = useMemo(() => ({
    height: exclusionZone.height,
    width: exclusionZone.width,
    offsetY: exclusionZone.offsetY || 0,
  }), [exclusionZone.height, exclusionZone.width, exclusionZone.offsetY]);

  const { nodes, connections } = useMemo(() => {
    try {
      const w = containerSize.width || screenWidth;
      const h = containerSize.height || screenHeight;

      // Define the central exclusion zone (clamped to container size)
      const textZoneHeight = Math.min(stableExclusion.height, h * 0.5);
      const textZoneWidth = Math.min(stableExclusion.width, w * 0.95);
      const excludeTop = (h - textZoneHeight) / 2 + (stableExclusion.offsetY || 0);
      const excludeBottom = excludeTop + textZoneHeight;
      const excludeLeft = (w - textZoneWidth) / 2;
      const excludeRight = excludeLeft + textZoneWidth;

      const generatedNodes: Node[] = [];
      let attempts = 0;
      const maxAttempts = nodeCount * 10;

      while (generatedNodes.length < nodeCount && attempts < maxAttempts) {
        const x = random(w * 0.05, w * 0.95);
        const y = random(h * 0.05, h * 0.95);

        // Check if the point is inside the exclusion zone
        const isInsideExclusion = 
          x > excludeLeft && x < excludeRight &&
          y > excludeTop && y < excludeBottom;

        if (!isInsideExclusion) {
          generatedNodes.push({
            id: generatedNodes.length,
            x: x,
            y: y,
            initialRadius: random(1, 3),
            initialOpacity: random(0.15, 0.65),
          });
        }
        attempts++;
      }

      // Ensure we have enough nodes; if not, relax exclusion and ignore the zone for some nodes
      if (generatedNodes.length < Math.max(5, Math.floor(nodeCount * 0.4))) {
        while (generatedNodes.length < Math.max(5, Math.floor(nodeCount * 0.7)) && attempts < maxAttempts * 2) {
          const x = random(w * 0.1, w * 0.9);
          const y = random(h * 0.1, h * 0.9);
          generatedNodes.push({
            id: generatedNodes.length,
            x,
            y,
            initialRadius: random(1, 3),
            initialOpacity: random(0.15, 0.65),
          });
          attempts++;
        }
      }

      // Generate connections
      const generatedConnections: Connection[] = [];
      const maxDistSq = (DEFAULT_MAX_CONNECTION_DISTANCE * (w / screenWidth)) ** 2;

      for (let i = 0; i < generatedNodes.length; i++) {
        for (let j = i + 1; j < generatedNodes.length; j++) {
          const distSq = (generatedNodes[i].x - generatedNodes[j].x) ** 2 + 
                        (generatedNodes[i].y - generatedNodes[j].y) ** 2;
          if (distSq < maxDistSq && Math.random() < CONNECTION_PROBABILITY) {
            generatedConnections.push({
              id: `${i}-${j}`,
              from: generatedNodes[i],
              to: generatedNodes[j],
            });
          }
        }
      }

      // Ensure minimum connections
      while (generatedConnections.length < Math.min(10, generatedNodes.length * 0.5) && generatedNodes.length >= 2) {
        const i = Math.floor(Math.random() * generatedNodes.length);
        let j = Math.floor(Math.random() * generatedNodes.length);
        if (i === j) j = (j + 1) % generatedNodes.length;
        
        const alreadyConnected = generatedConnections.some(c => 
          (c.from.id === i && c.to.id === j) || (c.from.id === j && c.to.id === i)
        );
        
        if (!alreadyConnected) {
          generatedConnections.push({
            id: `${i}-${j}`,
            from: generatedNodes[i],
            to: generatedNodes[j],
          });
        }
      }

      return { nodes: generatedNodes, connections: generatedConnections };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return { nodes: [], connections: [] };
    }
  }, [nodeCount, stableExclusion.height, stableExclusion.width, stableExclusion.offsetY, containerSize.width, containerSize.height]);

  // Initialize flicker animation
  useEffect(() => {
    try {
      flickerProgress.value = withRepeat(
        withTiming(1, { duration: animationDuration, easing: Easing.linear }), 
        -1, 
        false
      );
      setIsInitialized(true);
      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Animation error');
      setError(error.message);
      setIsLoading(false);
    }
  }, [flickerProgress, animationDuration]);

  // Activation cycle management
  useEffect(() => {
    if (!connections.length || !isInitialized) return;

    try {
      const id = setInterval(() => {
        setCurrentPathIndex((prev) => (prev + 1) % connections.length);
      }, cycleDuration);

      return () => clearInterval(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Cycle error');
      setError(error.message);
    }
  }, [connections.length, isInitialized, cycleDuration]);

  // Error handling - render fallback if there's an error
  if (error) {
    return null; // Return null instead of crashing
  }

  // Don't render until initialized
  if (!isInitialized || isLoading) {
    return null;
  }

  // Ensure we have valid nodes
  if (!nodes || nodes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={(e) => setContainerSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      <Canvas 
        style={StyleSheet.absoluteFill} 
        pointerEvents="none"
      >
      <Group>
        {/* Render static connections */}
        {connections && connections.length > 0 && connections.map((conn, index) => (
          <AnimatedConnection
            key={conn.id}
            connection={conn}
            isActivePath={index === currentPathIndex}
            flickerProgress={flickerProgress}
          />
        ))}

        {/* Render Animated Nodes */}
        {nodes && nodes.length > 0 && nodes.map((node) => {
          const activeConn = connections[currentPathIndex];
          const isActive = !!activeConn && (
            node.id === activeConn.from.id || node.id === activeConn.to.id
          );
          return (
            <AnimatedNode
              key={node.id}
              node={node}
              isActive={isActive}
              flickerProgress={flickerProgress}
            />
          );
        })}
      </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default NeuralGalaxy;
