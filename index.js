"use strict";

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const OUTPUT_DIR = "./dist";
const INFO_PATH = `./dist/info.json`;
const CHECKPOINT_PATH = `./dist/checkpoint.json`;
const LORA_PATH = `./dist/lora.json`;

// const OUTPUT_PATH = "./dist/latest.json";
// const BACKUP_PATH = `./dist/${moment().format("YYYYMMDD")}.json`;

const MAX_CHECKPOINT_COUNT = 11;
const MAX_CHECKPOINT_IMAGE_COUNT = 39;
const MAX_LORA_COUNT = 100;

const MIN_PP_COUNT_RATE = 0.33;
const MIN_NP_COUNT_RATE = 0.33;

const METADATA_KEYS = {
  "vae": ["vae", "VAE", "Vae"],
  "size": ["size","Size",], 
  "pp": ["prompt", "Prompt",],
  "np": ["negativePrompt", "Negative Prompt",],
  "seed": ["seed","Seed",],
  "clip": ["Clip skip",],
  "steps": ["steps", "Steps","STEMPS",],
  "sampler": ["Sampler", "sampler",],
  "denoise": ["Denoising strength", "Denoising Strength", "denoising strength", "Denoise", "denoise", "Strength", "strength"],
  "cfg": ["cfgScale", "cfg", "Guidance", "guidance",],
}

// deprecated
const CHECKPOINT_OPTIONS = {
  limit: MAX_CHECKPOINT_COUNT,
  types: "Checkpoint",

  // query: "DreamShaper",
  
  // sort: "Newest",
  // sort: "Highest Rated",
  sort: "Most Downloaded",

  period: "AllTime",
  // period: "Year",
  // period: "Month",
  // period: "Week",
  // period: "Day",
}

// deprecated
const LORA_OPTIONS = {
  limit: MAX_LORA_COUNT,
  types: "LORA",

  // query: "DreamShaper",
  
  // sort: "Newest",
  // sort: "Highest Rated",
  sort: "Most Downloaded",

  period: "AllTime",
  // period: "Year",
  // period: "Month",
  // period: "Week",
  // period: "Day",
}

function createInfo() {
  const createdAt = Date.now();
  fs.writeFileSync(INFO_PATH, JSON.stringify({
    checkpointCount: 0,
    checkpointVersionCount: 0,
    checkpointUpdatedAt: createdAt,
    lastCheckpointUrl: null,
    loraCount: 0,
    loraVersionCount: 0,
    loraUpdatedAt: createdAt,
    lastLoraUrl: null,
  }, null, 2), "utf8");
}

function wait(delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

async function getModels(options, nextPage) {
  let url;
  if (typeof options === "object") {
    const params = new URLSearchParams(options);
    url = nextPage || "https://civitai.com/api/v1/models?"+params.toString();
  } else {
    url = `https://civitai.com/api/v1/models/${options}`;
  }


  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.API_KEY}`,
  }

  // console.log("URL:", url);
  // console.log("Headers:", headers);

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  if (typeof options === "object") {
    return await res.json();
  } else {
    return {
      items: [await res.json()]
    }
  }
}

async function getCheckpoints(type, nextPage) {
  switch(type) {
    case "all": 
      return await getModels({
        limit: MAX_CHECKPOINT_COUNT,
        types: "Checkpoint",
        sort: "Most Downloaded",
        period: "AllTime",
      }, nextPage);
    case "new":
      return await getModels({
        limit: MAX_CHECKPOINT_COUNT,
        types: "Checkpoint",
        sort: "Newest",
        period: "Month",
      }, nextPage);
    case "week":
      return await getModels({
        limit: MAX_CHECKPOINT_COUNT,
        types: "Checkpoint",
        sort: "Highest Rated",
        period: "Week",
      }, nextPage);
    case "month":
      return await getModels({
        limit: MAX_CHECKPOINT_COUNT,
        types: "Checkpoint",
        sort: "Highest Rated",
        period: "Month",
      }, nextPage);
    default: 
      return await getModels(type, nextPage);
  }
}

async function getLoras(type, nextPage) {
  switch(type) {
    case "all": 
      return await getModels({
        limit: MAX_LORA_COUNT,
        types: "LORA",
        sort: "Most Downloaded",
        period: "AllTime",
      }, nextPage);
    case "new":
      return await getModels({
        limit: MAX_LORA_COUNT,
        types: "LORA",
        sort: "Newest",
        period: "Month",
      }, nextPage);
    case "week":
      return await getModels({
        limit: MAX_LORA_COUNT,
        types: "LORA",
        sort: "Highest Rated",
        period: "Week",
      }, nextPage);
    case "month":
      return await getModels({
        limit: MAX_LORA_COUNT,
        types: "LORA",
        sort: "Highest Rated",
        period: "Month",
      }, nextPage);
    default:
      return await getModels(type, nextPage);
  }
}

async function getImages(modelId, modelVersionId, username) {
  const params = new URLSearchParams({
    limit: MAX_CHECKPOINT_IMAGE_COUNT,
    modelId,
    modelVersionId,
    username,
  });

  const url = "https://civitai.com/api/v1/images?"+params.toString();
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.API_KEY}`,
  }

  // console.log("URL:", url);
  // console.log("Headers:", headers);

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  return await res.json();
}

function debug(obj) {
  fs.writeFileSync("./debug.json", JSON.stringify(obj, null , 2), "utf-8");
}

function isTagString(str) {
  str = str.replace(/\s/g, "");
  return /([a-zA-Z0-9]{,12},){3,}/.test(str) &&
    !/[0-9]{3,}x[0-9]{3,}/.test(str);
}

function getImageSize(image) {
  if (!image) {
    return;
  }
  if (image.meta) {
    for (const key of METADATA_KEYS.size) {
      if (image.meta[key]?.trim()) {
        return image.meta[key].trim();
      }
    }
  }
  if (image.width && image.height) {
    return `${image.width}x${image.height}`;
  }
}

function getImageSeed(image) {
  if (!image || !image.meta) {
    return;
  }
  for (const key of METADATA_KEYS.seed) {
    if (image.meta[key]) {
      return image.meta[key];
    }
  }
}

function getImageVAE(image) {
  if (!image || !image.meta) {
    return;
  }
  for (const key of METADATA_KEYS.vae) {
    if (image.meta[key]?.trim()) {
      return image.meta[key].trim();
    }
  }
}

function getImagePrompt(image) {
  if (!image || !image.meta) {
    return;
  }
  for (const key of METADATA_KEYS.pp) {
    if (image.meta[key]) {
      // for replace
      return " " + image.meta[key];
    }
  }
}

function getImageNegativePrompt(image) {
  if (!image || !image.meta) {
    return;
  }
  for (const key of METADATA_KEYS.np) {
    if (image.meta[key]?.trim()) {
      // for replace
      return " " + image.meta[key];
    }
  }
}

function getImageSteps(image) {
  if (!image || !image.meta) {
    return;
  }
  for (const key of METADATA_KEYS.steps) {
    if (image.meta[key]) {
      return image.meta[key];
    }
  }
}

function getImageSampler(image) {
  if (!image || !image.meta) {
    return;
  }
  for (const key of METADATA_KEYS.sampler) {
    if (image.meta[key]?.trim()) {
      return image.meta[key].trim();
    }
  }
}

function getImageCFG(image) {
  if (!image || !image.meta) {
    return;
  }
  for (const key of METADATA_KEYS.cfg) {
    if (image.meta[key]) {
      return image.meta[key];
    }
  }
}

function getMetaFromImages(images) {
  const meta = {
    vae: [],
    size: [],
    pp: [],
    np: [],
    steps: [],
    sampler: [],
    cfg: [],
  };

  if (!images) {
    return meta;
  }

  const add = (key, ...values) => {
    values = values.filter(Boolean);
    if (!key || values.length === 0) {
      return;
    }
    for (const value of values) {
      const prev = meta[key].find((item) => item.value === value);
      if (prev) {
        prev.count++;
      } else {
        meta[key].push({
          count: 1,
          value: value,
        });
      }
    }
  }

  for (const image of images) {
    const vae = getImageVAE(image);
    const size = getImageSize(image);
    const prompt = getImagePrompt(image);
    const pp = prompt
      // remvoe (, 1:1), )
      ?.replace(/\:(\d\.)?(\d+)?[\)\]\}]+/g, "")
      .replace(/([^\\])[\(\[\{]+/g, (_, x) => x)
      .replace(/([^\\])[\)\]\}]+/g, (_, x) => x)
      .split(",")
      .map((item) => item.trim()) || [];
    const negativePrompt = getImageNegativePrompt(image);
    const np = negativePrompt
      ?.replace(/\:(\d\.)?(\d+)?[\)\]\}]+/g, "")
      .replace(/([^\\])[\(\[\{]+/g, (_, x) => x)
      .replace(/([^\\])[\)\]\}]+/g, (_, x) => x)
      .split(",")
      .map((item) => item.trim()) || [];
    const steps = getImageSteps(image);
    const sampler = getImageSampler(image);
    const cfg = getImageCFG(image);

    add("vae", vae);
    add("size", size);
    add("pp", ...pp);
    add("np", ...np);
    add("steps", steps);
    add("sampler", sampler);
    add("cfg", cfg);
  }

  // optimize
  meta.pp = meta.pp.filter((item) => item.count > Math.floor(images.length * MIN_PP_COUNT_RATE));
  meta.np = meta.np.filter((item) => item.count > Math.floor(images.length * MIN_NP_COUNT_RATE));
  
  // sort and flatten
  for (const key of Object.keys(meta)) {
    meta[key] = meta[key].sort((a, b) => b.count - a.count)
      .map((item) => item.value);
  }

  return meta;
}

/**
 * 
 * @param {string} type all|new|month|week
 */
export async function collectCheckpoints(type = "all", skip = false) {
  if (!fs.existsSync(INFO_PATH)) {
    createInfo();
  }
  
  if (!fs.existsSync(CHECKPOINT_PATH)) {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({
      updatedAt: Date.now(),
      checkpoints: [],
    }), "utf8");
  }

  const info = JSON.parse(fs.readFileSync(INFO_PATH, "utf8"));
  const prev = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));

  let lastCheckpointUrl = skip ? info.lastCheckpointUrl : undefined,
    checkpointRes = await getCheckpoints(type, lastCheckpointUrl),
    checkpointCount = prev.checkpoints.length,
    versionCount = prev.checkpoints.reduce((acc, cur) => acc + cur.versions.length, 0),
    pageNum = 0;

  const save = function() {
    const updatedAt = Date.now();
    info.checkpointCount = checkpointCount;
    info.checkpointVersionCount = versionCount;
    info.lastCheckpointUrl = lastCheckpointUrl;
    info.checkpointUpdatedAt = updatedAt;
    prev.updatedAt = updatedAt;
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(prev), "utf8");
    fs.writeFileSync(INFO_PATH, JSON.stringify(info, null, 2), "utf8");
  }
  
  while(true) {
    let retryCount = 0;
    try {
      console.log(`Page: ${pageNum} > ${checkpointRes.items.length} checkpoints`);

      const prevCheckpointCount = checkpointCount;
      const prevVersionCount = versionCount;
  
      for (const checkpoint of checkpointRes.items) {
        if (!checkpoint) {
          continue;
        }
  
        console.log(`Checkpoint: ${checkpoint.name} > ${checkpoint.modelVersions.length} versions`);
  
        const creatorName = checkpoint.creator?.username;
  
        let prevCheckpoint = prev.checkpoints.find((item) => item.id === checkpoint.id);
        if (!prevCheckpoint) {
          prevCheckpoint = {
            id: checkpoint.id,
            name: checkpoint.name,
            versions: [],
          }
  
          prev.checkpoints.push(prevCheckpoint);
        }
  
        for (const version of checkpoint.modelVersions) {
          if (!version) {
            continue;
          }
  
          // console.log(`Version: ${version.name}`);
  
          const updatedAt = version.publishedAt || version.updatedAt || version.createdAt;
  
          let prevVersion = prevCheckpoint.versions.find((item) => item.id === version.id),
              isUpdated;
          if (!prevVersion) {
            prevVersion = {
              id: version.id,
              name: version.name,
              updatedAt: updatedAt,
              files: [],
              meta: {
                vae: [],
                size: [],
                pp: [],
                np: [],
                steps: [],
                sampler: [],
                cfg: [],
              },
            }
    
            prevCheckpoint.versions.push(prevVersion);
            isUpdated = true;
          } else {
            isUpdated = prevVersion.updatedAt !== updatedAt;
          }
  
          // pass unupdated version
          if (!isUpdated) {
            continue;
          }
  
          // update meta
          try {
            const imageRes = await getImages(checkpoint.id, version.id, creatorName);
  
            // console.log(`Images: ${imageRes?.items?.length || 0}`);
  
            const meta = getMetaFromImages(imageRes.items);
  
            prevVersion.meta = meta;
          } catch(err) {
            console.error(`Error: ${err.message}`);
            console.error(`       ${checkpoint.id} ${version.id} ${creatorName}`);
          }
          
          // update files
          prevVersion.files = version.files.map((file) => path.basename(file.name, path.extname(file.name)))
            .filter((item, index, array) => array.indexOf(item) === index)
            .filter(Boolean);
        }
      }
  
      checkpointCount = prev.checkpoints.length;
      versionCount = prev.checkpoints.reduce((acc, cur) => acc + cur.versions.length, 0);
  
      const checkpointDiff = checkpointCount - prevCheckpointCount;
      const versionDiff = versionCount - prevVersionCount;
  
      console.log(`${checkpointCount}(+${checkpointDiff}) checkpoints collected.`);
      console.log(`${versionCount}(+${versionDiff}) versions collected.`);
      
      if (checkpointRes.items.length == 0 || !checkpointRes?.metadata?.nextPage) {
        console.log("No more checkpoints");
        break;
      }
  
      lastCheckpointUrl = checkpointRes.metadata.nextPage;
      // save();
      checkpointRes = await getCheckpoints(type, lastCheckpointUrl);
      pageNum++;
    } catch(err) {
      if (retryCount >= 6) {
        throw err;
      }
      console.error(`Error: ${err.message}`);
      console.log("Retrying...");
      retryCount++;
      await wait(1000 * 10);
      checkpointRes = await getCheckpoints(type, lastCheckpointUrl);
    }
  }

  lastCheckpointUrl = null;
  save();

  console.log("Checkpoint collection completed");
}

/**
 * 
 * @param {string} type all|new|month|week
 */
export async function collectLoras(type = "all", skip = false) {
  if (!fs.existsSync(INFO_PATH)) {
    createInfo();
  }

  if (!fs.existsSync(LORA_PATH)) {
    fs.writeFileSync(LORA_PATH, JSON.stringify({
      updatedAt: Date.now(),
      loras: [],
    }), "utf8");
  }

  const info = JSON.parse(fs.readFileSync(INFO_PATH, "utf8"));
  const prev = JSON.parse(fs.readFileSync(LORA_PATH, "utf8"));

  let lastLoraUrl = skip ? info.lastLoraUrl : undefined,
    loraRes = await getLoras(type, lastLoraUrl),
    loraCount = prev.loras.length,
    versionCount = prev.loras.reduce((acc, cur) => acc + cur.versions.length, 0),
    pageNum = 0;

  const save = function() {
    const updatedAt = Date.now();
    info.loraCount = loraCount;
    info.loraVersionCount = versionCount;
    info.lastLoraUrl = lastLoraUrl;
    info.loraUpdatedAt = updatedAt;
    prev.updatedAt = updatedAt;
    fs.writeFileSync(LORA_PATH, JSON.stringify(prev), "utf8");
    fs.writeFileSync(INFO_PATH, JSON.stringify(info, null ,2), "utf8");
  }
  
  while(true) {
    let retryCount = 0;
    try {
      console.log(`Page: ${pageNum} > ${loraRes.items.length} loras`);

      const prevLoraCount = loraCount;
      const prevVersionCount = versionCount;

      for (const lora of loraRes.items) {
        if (!lora) {
          continue;
        }
  
        console.log(`Lora: ${lora.name} > ${lora.modelVersions.length} versions`);
  
        let prevLora = prev.loras.find((item) => item.id === lora.id);
        if (!prevLora) {
          prevLora = {
            id: lora.id,
            name: lora.name,
            versions: [],
          }
  
          prev.loras.push(prevLora);
        }

        for (const version of lora.modelVersions) {
          if (!version) {
            continue;
          }
  
          // console.log(`Version: ${version.name}`)
  
          const updatedAt = version.publishedAt || version.updatedAt || version.createdAt;
  
          let prevVersion = prevLora.versions.find((item) => item.id === version.id),
              isUpdated;
          if (!prevVersion) {
            prevVersion = {
              id: version.id,
              name: version.name,
              updatedAt: updatedAt,
              files: [],
              meta: {
                pp: [],
              },
            }
    
            prevLora.versions.push(prevVersion);
            isUpdated = true;
          } else {
            isUpdated = prevVersion.updatedAt !== updatedAt;
          }
  
          // pass unupdated version
          if (!isUpdated) {
            continue;
          }
  
          // update meta
          try {
            // "trainedWords": [
            //   "analog style",
            //   "modelshoot style",
            //   "nsfw",
            //   "nudity"
            // ],
            const meta = {
              pp: (version.trainedWords || [])
                .join(",")
                .replace(/\:(\d\.)?(\d+)?[\)\]\}]+/g, "")
                .replace(/([^\\])[\(\[\{]+/g, (_, x) => x)
                .replace(/([^\\])[\)\]\}]+/g, (_, x) => x)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
                .filter((item, index, array) => array.indexOf(item) === index),
            }
  
            prevVersion.meta = meta;
          } catch(err) {
            console.error(`Error: ${err.message}`);
            prevVersion.meta = {
              pp: [],
            };
          }
          
          // update files
          prevVersion.files = version.files.map((file) => path.basename(file.name, path.extname(file.name)))
            .filter((item, index, array) => array.indexOf(item) === index)
            .filter(Boolean);
        }
      }
  
      loraCount = prev.loras.length;
      versionCount = prev.loras.reduce((acc, cur) => acc + cur.versions.length, 0);
  
      const loraDiff = loraCount - prevLoraCount;
      const versionDiff = versionCount - prevVersionCount;
  
      console.log(`${loraCount}(+${loraDiff}) loras collected.`);
      console.log(`${versionCount}(+${versionDiff}) versions collected.`);
      
      if (loraRes.items.length == 0 || !loraRes?.metadata?.nextPage) {
        console.log("No more loras");
        break;
      }
  
      lastLoraUrl = loraRes.metadata.nextPage;
      // save();
      loraRes = await getLoras(type, lastLoraUrl);
      pageNum++;
    } catch(err) {
      if (retryCount >= 6) {
        throw err;
      }
      console.error(`Error: ${err.message}`);
      console.log("Retrying...");
      retryCount++;
      await wait(1000 * 10);
      loraRes = await getLoras(type, lastLoraUrl);
    }
  }

  lastLoraUrl = null;
  save();

  console.log("Lora collection completed");
}