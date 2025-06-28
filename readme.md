# Pixel Verse studio

this is a pixel art drawing app i have made wher you can draw your own pixel art on a grid and it has a bunch of cool features.

you can pick your faviroute color and use pencil or an eraser. there is also a fill tool to color big areas. i have added a bunch of other tools too

just like in photoshop you can add multiple layers and draw on them separately. you can hide them or change their opacity. and of course there's undo and redo buttons for when you mess up. when you're done you can download you're art as a png file.

## Why i made this webpage

* i really love pixel art but all the online editors were you have to pay for good features like layers
* i wanted to make a tool that was powerful but also really fun and inspiring to use
* i also just wanted to see if i could build a layer system myself becuase it seemed like a really interesting challenge

## How i made it

the whole thing is built with html css and javascript. i organized all the javascript code into a single big `class` to keep it from getting too messy.

the main canvas isnt actually a `<canvas>` element its just a grid of a bunch of `<div>`s. this made it really easy to handle clicks on individual pixels.

## Struggles and what i have learned

* i have to learn a different way to do it using a "stack" which was a new concept for me but it fixed the problem
* the layer system was big struggle just to figuring out how to manage all the data for each layer and took a lot of planning
* adding undo/redo to the layers was even harder right now it saves the entire canvas state every time you draw which probably uses up a lot of memory
* i really wanted to add a way to save and load you're whole project using localStorage but storing all that layer data was way more complicated than i thought so i have to skip it for now

## usage of AI

* Error Lens : finds error in realtime
* Amazon Q Cli : real time code suggestion and explains error
* ChatGPT and Claude : solves bigger porblems