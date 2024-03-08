"use client"; // This is a client component 👈🏽
import React, { useRef, useState, useEffect } from 'react'

import { Canvas } from '@react-three/fiber'
import { Stats, OrbitControls, Edges, GizmoHelper, GizmoViewport } from '@react-three/drei'

import { Convert, Position, Dimensions, Project, LiftPoint } from './project';

const Box = ({
  position,
  dimensions
}: {
  position: Position,
  dimensions: Dimensions
}) => {
  // This reference will give us direct access to the mesh
  const meshRef = useRef()

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      position={[0, 0, 0]}>
      <boxGeometry args={[dimensions.Length, dimensions.Height, dimensions.Width]} />
      <Edges />
    </mesh>
  )
}

const RenderLiftPoints = ({
  liftpoints
}: {
  liftpoints: LiftPoint[]
}) => {

  const liftPointList = liftpoints.map(
    liftpoint => <mesh
      position={[liftpoint.Position.X, liftpoint.Position.Y, liftpoint.Position.Z]}>
      <coneGeometry args={[1, 2, 8]} />
      <meshNormalMaterial />
      <Edges />
    </mesh>);

  return liftPointList;

}

const ProjectViewer = ({
  project
}: {
  project: Project
}) => {

  return (
    <Canvas
      camera={{ fov: 75, position: [40, 40, 40] }}
      shadows>

      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[30, 30, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />

      {(project != undefined) && <Box position={project.LiftObject.Position} dimensions={project.LiftObject.Dimensions} />}

      {(project != undefined) && <RenderLiftPoints liftpoints={project.LiftObject.LiftPoints} />}

      <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
        <GizmoViewport labelColor="white" axisHeadScale={1} />
      </GizmoHelper>

      <OrbitControls makeDefault enablePan={false} />
      <Stats />
    </Canvas >
  );
}

export default function Home() {

  // State to hold fetched data
  const [projects, setProjects] = useState<Project[]>([]);
  const BASE_URL = "https://raw.githubusercontent.com/scott223/renderer/main/app/data/projects.json";

  useEffect(() => {

    // Fetch data using Promise with the Fetch API
    const fetchUsingPromiseWithFetchApi = () => {
      fetch(BASE_URL) // Fetch data based on the current page
        .then((response) => response.json()) // Parse the response as JSON
        .then((data) => {
          setProjects(Convert.toProject(JSON.stringify(data))); // Set the fetched data
        });
    };

    // Trigger fetching method on component mount
    fetchUsingPromiseWithFetchApi();

  }, []); // Run the effect only once on component mount

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="border-solid border-2 border-indigo-600 w-full h-screen">
        <ProjectViewer project={projects[0] as Project} />
      </div>
    </main>
  );
}
