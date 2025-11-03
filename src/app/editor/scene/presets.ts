import pockitmap from "@/app/map.json";
import game1 from "@/app/game1/map.json";
import killbox from "@/app/milady/map.json";
import pockitOutdoors from "@/app/about/map.json";
import test from "@/app/test/map.json";

const presets = {
  "flat": [
    {
      "id": "zwdcat6g3",
      "name": "Root",
      "children": [
        {
          "id": "kdq9whzkx",
          "name": "floor",
          "children": [],
          "components": [
            {
              "type": "boxGeometry",
              "args": [
                10,
                0.01,
                10
              ]
            },
            {
              "type": "meshStandardMaterial",
              "props": {
                "color": "#ffd129"
              }
            },
            {
              "type": "physics",
              "props": {
                "type": "fixed"
              }
            }
          ]
        }
      ],
      "components": []
    }
  ],
  drive: [
    {
      "id": "zwdcat6g3",
      "name": "Root",
      "children": [
        {
          "id": "rpbjk31xk",
          "name": "cathedral.glb",
          "children": [],
          "components": [
            {
              "type": "model",
              "filename": "cathedral.glb"
            },
            {
              "type": "physics",
              "props": {
                "type": "fixed"
              }
            }
          ],
          "transform": {
            "position": [
              0,
              0,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": 1
          }
        }
      ],
      "components": []
    }
  ],
  pockit: pockitmap,
  game1: game1,
  killbox: killbox,
  pockitOutdoors: pockitOutdoors,
  test: test,
}

export default presets;