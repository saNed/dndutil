#### Purpose of Doc
This doc describes the product requirements for a small web utility you and I will build together.

The utility is a webpage that displays the current dungeon map for my D&D game. We will have it up on the tv while the players play in person. The main problem this utility solves is to not reveal the entire map at once to the players, since in-game they should only be able to have a view of what's happening within line-of-sight. Viewing the whole map kinds spoils things.

btw, there's a sample map at ./cragmaw_castle.jpeg if you want to take a look

#### Product Overview
The utility is used only by the Dungeon Master. Here are the steps he will take:
1) he presses the "Choose Local Map File" button
	-  this "uploads" the map (really the browser just holds the map in memory)
2) he presses the "Edit Walls" button
	- this lets him draw lines on a Canvas layer that is overlayed on top of the map. The first time he clicks into the Canvas with this mode activated creates a wall vertex. Every subsequent click creates another wall vertex connected to the previous wall vertex (you can chain these, store as list). If he double clicks, this will demarcate the final wall vertex in the chain. A future click onto the canvas will create a new wall.
	- If he didn't like the wall he drew, he can click on any of the verteces of an existing wall then press the "delete/backspace" key to get rid of it
	- he can also click onto a vertex, then drag it around to move its position
	- Once two vertices exist in a wall that we're creating (and once the wall exists), we should render a line between those two points on the canvas.
	- The "Edit Walls" button once pressed should become a button called "Stop Editing Walls" that returns us to viewing status
3) then he presses the "Play Game"
	- this should turn on a "third layer" that is a layer of fog on top of everything
		- (the first being the map image and the second being the walls. As an aside: I've been talking about using a canvas for the walls, but feel free to use whatever tech makes the most sense. Perhaps this mode and the walls can be all one "layer", perhaps they're separate).
	- the fog covers the entire map and is grey, but perhaps shimmering and has a small animation. That's a flourish though.
	- In this mode, the DM can click to spawn a PC (player character).
		- Player characters can view their surroundings, up to 30 feet. Create a variable for this and I'll let to the DM adjust it in the browser dev console as appropriate.
		- This means that the fog disappears in a 30ft radius around the PC and the real players can now see that part of the map.
		- If the DM double clicks on the map they can create a new player character
	- If the DM triple clicks on the map, they can create a new NPC. NPCs will be vertexes that are RED. They do not affect the fog rendering.
	- If the DM clicks and drags on a player character, the fog should dissipate around them within the 30 ft radius. Once dissipated, the fog does not return.
	- HOWEVER, PCs cant see through walls! if there is a wall in the 30ft radius the player can see up to the wall, but not past it.
	- Also in this mode: the DM can tap a wall vertex to select it, then drag it around to move it. The wall that this wall vertex is connect to should dynamically change to account for the new position of the wall.
		- this is a cheeky little optimization to allow the DM to open doors, and have doors behave as walls that can be opened.
