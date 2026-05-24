"use client"
import Head from 'next/head'
import React from 'react'

type OpenGraph = {
  title?: string
  description?: string
  url?: string
  type?: string
  image?: string
}

type Props = {
  title?: string
  description?: string
  canonical?: string
  openGraph?: OpenGraph
  twitterHandle?: string
  robots?: string
}

export default function MetaTags({
  title,
  description,
  canonical,
  openGraph,
  twitterHandle,
  robots = 'index,follow',
}: Props) {
  const og = openGraph || {}

  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="robots" content={robots} />

      {/* Open Graph */}
      {og.title && <meta property="og:title" content={og.title} />}
      {og.description && <meta property="og:description" content={og.description} />}
      {og.url && <meta property="og:url" content={og.url} />}
      {og.type && <meta property="og:type" content={og.type} />}
      {og.image && <meta property="og:image" content={og.image} />}

      {/* Twitter */}
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      {og.title && <meta name="twitter:title" content={og.title} />}
      {og.description && <meta name="twitter:description" content={og.description} />}
      {og.image && <meta name="twitter:image" content={og.image} />}
    </Head>
  )
}
