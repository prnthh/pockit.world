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
]
}

export default presets;