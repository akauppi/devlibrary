import axios from "axios";

import { BlogMetadata } from "../../shared/types/BlogMetadata";
import { RepoMetadata } from "../../shared/types/RepoMetadata";
import { BlogData, BlogStats, RepoData, RepoStats } from "../../shared/types";

import * as github from "./github";

export async function loadRepoStats(
  metadata: RepoMetadata,
  existing: RepoData | undefined
): Promise<RepoStats> {
  // Determine the date the content was added to the site
  const dateAdded =
    existing && existing.stats.dateAdded
      ? existing.stats.dateAdded
      : new Date().getTime();

  const repo = await github.getRepo(metadata.owner, metadata.repo);

  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    dateAdded,
    lastUpdated: Date.parse(repo.updated_at),
  };
}

export async function loadBlogStats(
  metadata: BlogMetadata,
  existing: BlogData | undefined
): Promise<BlogStats> {
  // Determine the date the content was added to the site
  const dateAdded =
    existing && existing.stats.dateAdded
      ? existing.stats.dateAdded
      : new Date().getTime();

  // Medium has a secret JSON API
  const url = `${metadata.link}?format=json`;

  console.log(url);

  const res = await axios.get(url);

  // Payloads start with something like this to prevent eval:
  // ])}while(1);</x>{
  // We just start at the first {
  const payload = res.data as string;

  try {
    const data = JSON.parse(payload.substr(payload.indexOf("{")));

    const minutes = Math.round(data.payload.value.virtuals.readingTime);
    const claps = data.payload.value.virtuals.totalClapCount;
    const lastUpdated = data.payload.value.latestPublishedAt;

    return {
      minutes,
      claps,
      dateAdded,
      lastUpdated,
    };
  } catch (e) {
    console.error(`Could not get stats for ${metadata.link}`, e);

    // By default we'll just say 10 minute read, 50 claps, 30 days ago.
    return {
      minutes: 10,
      claps: 50,
      dateAdded,
      lastUpdated: new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
    };
  }
}