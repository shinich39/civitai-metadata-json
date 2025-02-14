# civitai-metadata-json

Collect metadata from civitai

## Usage

Copy [checkpoint.json](https://raw.githubusercontent.com/shinich39/civitai-metadata-json/refs/heads/main/dist/checkpoint.json) and [lora.json](https://raw.githubusercontent.com/shinich39/civitai-metadata-json/refs/heads/main/dist/lora.json) file from dist directory and use it.  

- info.json

```js
{
  "checkpointCount": 9623,
  "checkpointVersionCount": 21342,
  "checkpointUpdatedAt": 1739257702227,
  "lastCheckpointUrl": null,
  "loraCount": 208392,
  "loraVersionCount": 263895,
  "loraUpdatedAt": 1739284501284,
  "lastLoraUrl": null
}
```

- checkpoint.json

```js
{
  "updatedAt":1739206587665
  "checkpoints": [
    {
      "id": 4201,
      "name": "Realistic Vision V6.0 B1",
      "versions": [
        {
          "id": 501240,
          "name": "V5.1 Hyper (VAE)",
          "updatedAt": "2024-05-12T06:24:13.109Z",
          "files": [
            "realisticVisionV60B1_v51HyperVAE"
          ],
          "meta": {
            "vae": [
              "vae-ft-mse-840000-ema-pruned.safetensors"
            ],
            "size": [
              "512x768",
              "640x960",
              "768x512"
            ],
            "pp": [],
            "np": [
              "nsfw",
              "naked",
              "nude",
              "deformed iris",
              "deformed pupils",
              "semi-realistic",
              "cgi",
              "3d",
              "render",
              "sketch",
              "cartoon",
              "drawing",
              "anime",
              "mutated hands and fingers",
              "deformed",
              "distorted",
              "disfigured",
              "poorly drawn",
              "bad anatomy",
              "wrong anatomy",
              "extra limb",
              "missing limb",
              "floating limbs",
              "disconnected limbs",
              "mutation",
              "mutated",
              "ugly",
              "disgusting",
              "amputation"
            ],
            "steps": [
              6
            ],
            "sampler": [
              "DPM++ SDE Karras"
            ],
            "cfg": [
              1.5
            ]
          }
        }
      ]
    }
  ]
}
```

- lora.json

```js
{
  "updatedAt": 1739237056225,
  "loras": [
    {
      "id": 264290,
      "name": "Not Artists Styles for Pony Diffusion V6 XL",
      "versions": [
        {
          "id": 882225,
          "name": "Sketch Illustration",
          "updatedAt": "2024-09-23T07:16:55.030Z",
          "files": [
            "Sketch Illustration Style [LoRA] - Pony V6 XL"
          ],
          "meta": {
            "pp": [
              "sketch",
              "monochrome",
              "greyscale"
            ]
          }
        }
      ]
    }
  ]
}
```