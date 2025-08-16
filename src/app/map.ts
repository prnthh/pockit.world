const drive = [
  {
    "id": "zwdcat6g3",
    "name": "Root",
    "children": [
      {
        "id": "v2g0bl51c",
        "name": "pockitworld.glb",
        "children": [],
        "components": [
          {
            "type": "model",
            "filename": "pockitworld.glb"
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
            -0.10930199250129524
          ],
          "rotation": [
            0,
            0,
            0
          ],
          "scale": 1
        }
      },
      {
        "id": "ixokf9gqp",
        "name": "Desk.glb",
        "children": [],
        "components": [
          {
            "type": "model",
            "filename": "Desk.glb"
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
            1.6745714118741764,
            0,
            -0.2
          ],
          "rotation": [
            0,
            3.14,
            0
          ],
          "scale": 0.7
        }
      },
      {
        "id": "2lzo5whib",
        "name": "easel.glb",
        "children": [],
        "components": [
          {
            "type": "model",
            "filename": "easel.glb"
          },
          {
            "type": "pointerEvent",
            "args": [
              "link",
              "https://draw.pockit.world/"
            ]
          }
        ],
        "transform": {
          "position": [
            -2.1140197045613154,
            0.6086985079151319,
            0.1969743797129483
          ],
          "rotation": [
            0,
            0.4,
            0
          ],
          "scale": 0.19999999999999993
        }
      },
      {
        "id": "98xn4jcf8",
        "name": "Walkie talkie.glb",
        "children": [],
        "components": [
          {
            "type": "model",
            "filename": "Walkie talkie.glb"
          },
          {
            "type": "pointerEvent",
            "args": [
              "link",
              "https://x.com/pockitmilady"
            ]
          }
        ],
        "transform": {
          "position": [
            2.0753643151160457,
            0.6276697806487637,
            -0.10733242498259923
          ],
          "rotation": [
            0,
            -0.5,
            0
          ],
          "scale": 0.04
        }
      }
    ],
    "components": []
  }
];

export default drive;