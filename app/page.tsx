"use client"; // This is a client component 👈🏽
import React, { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats, OrbitControls } from '@react-three/drei'

import { Convert, Position, Dimensions, Project } from './project';

const Box = ({
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
    </mesh>
  )
}

const LiftObjectViewer = ({
  project
}: {
  project: Project
}) => {
  return (
    <Canvas camera={{ fov: 75, position: [40, 40, 40] }}>

      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[30, 30, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      {(project != undefined) && <Box position={project.LiftObject.Position} dimensions={project.LiftObject.Dimensions} />}

      <axesHelper args={[20]} />
      <OrbitControls enablePan={false} />
      <Stats />
    </Canvas>
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="border-solid border-2 border-indigo-600 w-1/2 h-full">
        <LiftObjectViewer project={projects[0] as Project} />
      </div>
    </main>
  );
}
