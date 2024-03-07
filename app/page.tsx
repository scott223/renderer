"use client"; // This is a client component 👈🏽

import { createRoot } from 'react-dom/client'
import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Convert, Project } from './Project';
import { read } from 'fs';


// Make the `request` function generic
// to specify the return data type:
function request<TResponse>(
  url: string,
  // `RequestInit` is a type for configuring 
  // a `fetch` request. By default, an empty object.
  config: RequestInit = {}

  // This function is async, it will return a Promise:
): Promise<TResponse> {

  // Inside, we call the `fetch` function with 
  // a URL and config given:
  return fetch(url, config)
    // When got a response call a `json` method on it
    .then((response) => response.json())
    // and return the result data.
    .then((data) => data as TResponse);

  // We also can use some post-response
  // data-transformations in the last `then` clause.
}

function Box(dimensions: IDimensions) {
  // This reference will give us direct access to the mesh
  const meshRef = useRef()

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  )
}

function LiftObjectViewer() {
  return (
    <Canvas>

      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <axesHelper args={[5]} />
    </Canvas>
  );
}

export default async function Home() {
  const project = await request<Project>('https://raw.githubusercontent.com/janheindejong/RiggingDesigner/master/RiggingDesigner.Tests/Data/BasicProjectData.json?token=GHSAT0AAAAAACN7K4CAAPC5SP23J75ZGZQ2ZPKGOSA');

  console.log(project);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="border-solid border-2 border-indigo-600 w-1/2 h-full">
        <LiftObjectViewer />
      </div>
    </main>
  );
}
