"use client"; // This is a client component 👈🏽

import { createRoot } from 'react-dom/client'
import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Convert, Dimensions, Project } from './project';
import { read } from 'fs';


// Make the `request` function generic
// to specify the return data type:
function getProjects(

  config: RequestInit = {}

  // This function is async, it will return a Promise:
): Promise<Project[]> {

  // Inside, we call the `fetch` function with 
  // a URL and config given:
  return fetch('https://raw.githubusercontent.com/scott223/renderer/main/app/data/projects.json', config)
    // When got a response call a `json` method on it
    .then((response) => response.json())
    // and return the result data converted to 
    .then((data) => {
      const projects = Convert.toProject(JSON.stringify(data));
      return projects;
    });

  // We also can use some post-response
  // data-transformations in the last `then` clause.
}

const Box = ({
  dimensions
}: {
  dimensions: Dimensions
}) => {
  // This reference will give us direct access to the mesh
  const meshRef = useRef()

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      position={[0, 0, 0]}>
      <boxGeometry args={[dimensions.Height, dimensions.Length, dimensions.Width]} />
    </mesh>
  )
}

interface IProject {
  project: Project
}

const LiftObjectViewer = ({
  project
}: {
  project: Project
}) => {
  return (
    <Canvas>

      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <Box dimensions={project.LiftObject.Dimensions} />

      <axesHelper args={[5]} />
    </Canvas>
  );
}

export default async function Home() {
  const projects: Project[] = await getProjects();
  console.log(projects);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="border-solid border-2 border-indigo-600 w-1/2 h-full">
        <LiftObjectViewer project={projects[0] as Project} />
      </div>
    </main>
  );
}
