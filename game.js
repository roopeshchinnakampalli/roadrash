class RoadRash3D {
    constructor() {
        this.state = 'menu'; // 'menu', 'playing', 'gameover'
        this.gameTime = 0;
        this.keys = {};

        // Three.js setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 500, 2000);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
        this.camera.position.z = 20;
        this.camera.position.y = 15;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        document.getElementById('container').appendChild(this.renderer.domElement);

        // Lighting
        const sunlight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunlight.position.set(100, 200, 100);
        sunlight.castShadow = true;
        sunlight.shadow.mapSize.width = 2048;
        sunlight.shadow.mapSize.height = 2048;
        sunlight.shadow.camera.left = -500;
        sunlight.shadow.camera.right = 500;
        sunlight.shadow.camera.top = 500;
        sunlight.shadow.camera.bottom = -500;
        this.scene.add(sunlight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Game objects
        this.player = null;
        this.opponents = [];
        this.raceDistance = 8000;

        this.createWorld();
        this.initGame();
        this.setupEvents();
        this.setupAnimation();
    }

    createWorld() {
        // Create detailed road texture with lane markings
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 512;
        roadCanvas.height = 512;
        const roadCtx = roadCanvas.getContext('2d');
        
        // Dark asphalt base
        roadCtx.fillStyle = '#2a2a2a';
        roadCtx.fillRect(0, 0, 512, 512);
        
        // Road surface detail
        roadCtx.fillStyle = '#333333';
        for (let i = 0; i < 50; i++) {
            roadCtx.fillRect(Math.random() * 512, Math.random() * 512, 5, 5);
        }
        
        // Center yellow lines
        roadCtx.fillStyle = '#FFFF00';
        roadCtx.fillRect(0, 200, 512, 20);
        roadCtx.fillRect(0, 312, 512, 20);
        
        // White lane dividers
        roadCtx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 10; i++) {
            roadCtx.fillRect(0, i * 100 + 50, 512, 8);
        }
        
        const roadTexture = new THREE.CanvasTexture(roadCanvas);
        roadTexture.repeat.set(2, 40);
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        
        // Main road with texture
        const roadGeom = new THREE.PlaneGeometry(40, 8000);
        const roadMat = new THREE.MeshStandardMaterial({
            map: roadTexture,
            roughness: 0.8,
            metalness: 0.1
        });
        const road = new THREE.Mesh(roadGeom, roadMat);
        road.receiveShadow = true;
        road.rotation.x = -Math.PI / 2;
        this.scene.add(road);
        
        // Road shoulders (dark edges)
        const shoulderGeom = new THREE.PlaneGeometry(15, 8000);
        const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const leftShoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
        leftShoulder.rotation.x = -Math.PI / 2;
        leftShoulder.position.set(-27.5, 0, 0);
        leftShoulder.receiveShadow = true;
        this.scene.add(leftShoulder);
        
        const rightShoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
        rightShoulder.rotation.x = -Math.PI / 2;
        rightShoulder.position.set(27.5, 0, 0);
        rightShoulder.receiveShadow = true;
        this.scene.add(rightShoulder);

        // Buildings on the sides with better variety and detail
        const buildingColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A, 0x98D8C8, 0xF7DC6F, 0xBB8FCE];
        for (let i = 0; i < 30; i++) {
            const height = 40 + Math.random() * 120;
            const width = 25 + Math.random() * 50;
            const depth = 35 + Math.random() * 20;
            const buildingGeom = new THREE.BoxGeometry(width, height, depth);
            
            const buildingColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
            const buildingMat = new THREE.MeshStandardMaterial({ 
                color: buildingColor,
                roughness: 0.7,
                metalness: 0.1
            });
            const building = new THREE.Mesh(buildingGeom, buildingMat);
            building.castShadow = true;
            building.receiveShadow = true;
            
            // Add windows to building
            const windowGeom = new THREE.BoxGeometry(width * 0.8, height * 0.8, 0.5);
            const windowMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const windows = new THREE.Mesh(windowGeom, windowMat);
            windows.position.z = depth / 2 + 0.5;
            building.add(windows);
            
            const side = Math.random() > 0.5 ? 1 : -1;
            building.position.set(
                side * (35 + Math.random() * 60),
                height / 2,
                -i * 350 - 100
            );
            this.scene.add(building);
        }
        
        // Add decorative trees
        for (let i = 0; i < 25; i++) {
            const trunkGeom = new THREE.CylinderGeometry(2, 3, 30, 8);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4E37, roughness: 0.9 });
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            
            const foliageGeom = new THREE.SphereGeometry(15, 8, 8);
            const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2D5016, roughness: 0.8 });
            const foliage = new THREE.Mesh(foliageGeom, foliageMat);
            foliage.position.y = 30;
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (55 + Math.random() * 50);
            const z = -i * 400 - Math.random() * 200;
            
            trunk.position.set(x, 15, z);
            foliage.position.set(x, 45, z);
            
            this.scene.add(trunk);
            this.scene.add(foliage);
        }
        
        // Add street lamp poles
        for (let i = 0; i < 15; i++) {
            const poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 35, 8);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const pole = new THREE.Mesh(poleGeom, poleMat);
            pole.castShadow = true;
            pole.receiveShadow = true;
            pole.position.set(-32, 17.5, -i * 600);
            this.scene.add(pole);
            
            // Lamp head  
            const lampGeom = new THREE.BoxGeometry(3, 2, 3);
            const lampMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
            const lamp = new THREE.Mesh(lampGeom, lampMat);
            lamp.position.set(-32, 38, -i * 600);
            lamp.castShadow = true;
            this.scene.add(lamp);
        }

        // Finish line
        const finishLineGeom = new THREE.BoxGeometry(30, 0.5, 10);
        const finishLineMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        const finishLine = new THREE.Mesh(finishLineGeom, finishLineMat);
        finishLine.receiveShadow = true;
        finishLine.position.set(0, 0.5, -this.raceDistance);
        this.scene.add(finishLine);

        // Finish flag
        const flagPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 50),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        flagPole.position.set(-20, 25, -this.raceDistance);
        flagPole.castShadow = true;
        this.scene.add(flagPole);
    }

    initGame() {
        // Player motorcycle
        this.player = this.createMotorcycle(0, 0, 0, '#00FF00', true);
        this.player.data = {
            lane: 0,
            distance: 0,
            speed: 0,
            maxSpeed: 360,
            health: 100,
            attacking: 0,
            rank: 1
        };

        // Opponent motorcycles
        const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF', '#FFA500'];
        for (let i = 0; i < 7; i++) {
            const opp = this.createMotorcycle(i % 3, 0, 0, colors[i], false);
            opp.data = {
                lane: i % 3,
                distance: -100 - i * 50,
                speed: 100 + Math.random() * 80,
                maxSpeed: 280 + Math.random() * 50,
                health: 100,
                attacking: 0,
                targetLane: i % 3,
                laneTimer: 0,
                id: i
            };
            this.opponents.push(opp);
        }
    }

    createMotorcycle(lane, x, z, color, isPlayer) {
        const motorcycle = new THREE.Group();

        // More detailed bike body with better proportions
        const bikeGeom = new THREE.BoxGeometry(1.8, 1.2, 4);
        const bikeMat = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color),
            metalness: 0.8,
            roughness: 0.3
        });
        const bikeBody = new THREE.Mesh(bikeGeom, bikeMat);
        bikeBody.castShadow = true;
        bikeBody.receiveShadow = true;
        bikeBody.position.y = 0.6;
        motorcycle.add(bikeBody);
        
        // Front fairing/cowl
        const fairingGeom = new THREE.BoxGeometry(1.6, 1.8, 1.2);
        const fairingMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color).multiplyScalar(0.9),
            metalness: 0.7,
            roughness: 0.2
        });
        const fairing = new THREE.Mesh(fairingGeom, fairingMat);
        fairing.position.set(0, 1.8, -1.5);
        fairing.castShadow = true;
        motorcycle.add(fairing);

        // Rider body (suit)
        const riderBodyGeom = new THREE.BoxGeometry(0.8, 1.2, 0.5);
        const riderSuitColor = new THREE.Color(color).multiplyScalar(0.7);
        const riderMat = new THREE.MeshStandardMaterial({ 
            color: riderSuitColor,
            metalness: 0.4,
            roughness: 0.6
        });
        const riderBody = new THREE.Mesh(riderBodyGeom, riderMat);
        riderBody.position.set(0, 2.2, -0.5);
        riderBody.castShadow = true;
        motorcycle.add(riderBody);
        
        // Rider head with helmet
        const helmetGeom = new THREE.SphereGeometry(0.35, 8, 8);
        const helmetMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.7,
            roughness: 0.3
        });
        const helmet = new THREE.Mesh(helmetGeom, helmetMat);
        helmet.position.set(0, 3.3, -0.2);
        helmet.castShadow = true;
        motorcycle.add(helmet);
        
        // Helmet visor (tinted)
        const visorGeom = new THREE.BoxGeometry(0.5, 0.18, 0.15);
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0x4488FF,
            metalness: 0.95,
            roughness: 0.05
        });
        const visor = new THREE.Mesh(visorGeom, visorMat);
        visor.position.set(0, 3.2, -0.05);
        motorcycle.add(visor);

        // Wheels (larger, more realistic)
        const wheelGeom = new THREE.CylinderGeometry(1.1, 1.1, 0.5, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.7
        });
        
        const frontWheel = new THREE.Mesh(wheelGeom, wheelMat);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, 1.1, -2.5);
        frontWheel.castShadow = true;
        motorcycle.add(frontWheel);
        
        // Front wheel rim
        const rimGeom = new THREE.TorusGeometry(1.05, 0.15, 8, 16);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
        const frontRim = new THREE.Mesh(rimGeom, rimMat);
        frontRim.rotation.y = Math.PI / 2;
        frontRim.position.set(0, 1.1, -2.5);
        motorcycle.add(frontRim);

        const backWheel = new THREE.Mesh(wheelGeom, wheelMat);
        backWheel.rotation.z = Math.PI / 2;
        backWheel.position.set(0, 1.1, 2.5);
        backWheel.castShadow = true;
        motorcycle.add(backWheel);
        
        // Back wheel rim
        const backRim = new THREE.Mesh(rimGeom, rimMat);
        backRim.rotation.y = Math.PI / 2;
        backRim.position.set(0, 1.1, 2.5);
        motorcycle.add(backRim);
        
        // Suspension fork (front)
        const forkGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.8);
        const forkMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const fork = new THREE.Mesh(forkGeom, forkMat);
        fork.position.set(-0.3, 1.2, -2.5);
        motorcycle.add(fork);
        
        const fork2 = new THREE.Mesh(forkGeom, forkMat);
        fork2.position.set(0.3, 1.2, -2.5);
        motorcycle.add(fork2);
        
        // Frame tubes
        const frameGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.5);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const frame = new THREE.Mesh(frameGeom, frameMat);
        frame.rotation.z = Math.PI / 2;
        frame.position.set(0.5, 1.5, 0);
        motorcycle.add(frame);

        // Health bar background
        const healthBarBgGeom = new THREE.PlaneGeometry(3.2, 0.4);
        const healthBarBgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const healthBarBg = new THREE.Mesh(healthBarBgGeom, healthBarBgMat);
        healthBarBg.position.y = 4.2;
        healthBarBg.position.z = 0.2;
        motorcycle.add(healthBarBg);
        
        // Health bar (foreground)
        const healthBarGeom = new THREE.PlaneGeometry(3, 0.3);
        const healthBarMat = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
        const healthBar = new THREE.Mesh(healthBarGeom, healthBarMat);
        healthBar.position.y = 4.2;
        healthBar.position.z = 0.25;
        motorcycle.healthBar = healthBar;
        motorcycle.healthBarMaterial = healthBarMat;
        motorcycle.add(healthBar);

        // Position based on lane (-1, 0, 1)
        motorcycle.position.x = lane * 12;
        motorcycle.position.z = z;
        
        this.scene.add(motorcycle);
        motorcycle.data = {};
        return motorcycle;
    }

    setupEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (this.state === 'menu') this.play();
                if (this.state === 'gameover') this.reset();
            }
            if (e.key === 'z') this.attack(-1);
            if (e.key === 'x') this.attack(1);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('startButton').addEventListener('click', () => {
            if (this.state === 'menu') this.play();
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            if (this.state === 'gameover') this.reset();
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    play() {
        this.state = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('hud').style.display = 'block';
        this.gameTime = 0;
    }

    reset() {
        this.state = 'menu';
        this.gameTime = 0;
        
        this.player.data.distance = 0;
        this.player.data.speed = 0;
        this.player.data.health = 100;
        this.player.data.lane = 0;

        this.opponents.forEach(opp => {
            opp.data.distance = -100 - opp.data.id * 50;
            opp.data.speed = 100 + Math.random() * 80;
            opp.data.health = 100;
        });

        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('hud').style.display = 'none';
    }

    attack(direction) {
        if (this.state !== 'playing') return;
        if (this.player.data.attacking > 0) return;

        this.player.data.attacking = 0.4;
        const attackRange = 30;
        const laneTolerance = 1.5;

        for (let opp of this.opponents) {
            const distDiff = opp.data.distance - this.player.data.distance;
            const laneDiff = Math.abs(opp.data.lane - this.player.data.lane);

            if (distDiff > 0 && distDiff < attackRange && laneDiff < laneTolerance) {
                opp.data.health -= 25;
                if (opp.data.health < 0) opp.data.health = 0;
            }
        }
    }

    update(dt) {
        if (this.state !== 'playing') return;

        this.gameTime += dt;

        // Player update
        if (this.keys['ArrowUp'] && this.player.data.speed < this.player.data.maxSpeed) {
            this.player.data.speed += 200 * dt;
        }
        if (this.keys['ArrowDown']) {
            this.player.data.speed -= 180 * dt;
        }
        if (!this.keys['ArrowUp'] && !this.keys['ArrowDown']) {
            this.player.data.speed *= 0.97;
        }

        this.player.data.speed = Math.max(0, Math.min(this.player.data.speed, this.player.data.maxSpeed * (this.player.data.health / 100)));

        // Lane changes
        if (this.keys['ArrowLeft'] && this.player.data.lane > -1) {
            this.player.data.lane = -1;
        }
        if (this.keys['ArrowRight'] && this.player.data.lane < 1) {
            this.player.data.lane = 1;
        }

        this.player.data.distance += this.player.data.speed * dt;
        this.player.data.attacking = Math.max(0, this.player.data.attacking - dt);

        // Opponent update
        for (let opp of this.opponents) {
            opp.data.speed += (Math.random() - 0.5) * 50 * dt;
            opp.data.speed = Math.max(50, Math.min(opp.data.speed, opp.data.maxSpeed));
            opp.data.distance += opp.data.speed * dt;

            opp.data.laneTimer -= dt;
            if (opp.data.laneTimer <= 0 && Math.random() < 0.1) {
                opp.data.targetLane = Math.floor(Math.random() * 3) - 1;
                opp.data.laneTimer = 2 + Math.random() * 3;
            }

            const laneSpeed = 2;
            if (opp.data.lane < opp.data.targetLane) opp.data.lane = Math.min(1, opp.data.lane + laneSpeed * dt);
            if (opp.data.lane > opp.data.targetLane) opp.data.lane = Math.max(-1, opp.data.lane - laneSpeed * dt);

            // Opponent attacks occasionally
            opp.data.attacking = Math.max(0, opp.data.attacking - dt);
            if (opp.data.attacking <= 0 && Math.random() < 0.05) {
                opp.data.attacking = 0.4;
                const distDiff = this.player.data.distance - opp.data.distance;
                const laneDiff = Math.abs(this.player.data.lane - opp.data.lane);
                if (distDiff > 0 && distDiff < 30 && laneDiff < 1.5) {
                    this.player.data.health -= 15;
                }
            }
        }

        // Calculate rank
        const allRacers = [this.player, ...this.opponents].sort((a, b) => b.data.distance - a.data.distance);
        this.player.data.rank = allRacers.indexOf(this.player) + 1;

        // Check end conditions
        if (this.player.data.health <= 0) {
            this.end(false);
        } else if (this.player.data.distance >= this.raceDistance) {
            const topRacers = allRacers.slice(0, 3);
            const won = topRacers.includes(this.player);
            this.end(won);
        }

        // Update HUD
        document.getElementById('positionValue').textContent = `${this.player.data.rank}/8`;
        document.getElementById('speedValue').textContent = `${Math.floor(this.player.data.speed)} mph`;
        document.getElementById('healthValue').textContent = `${Math.floor(this.player.data.health)}%`;
        document.getElementById('distanceValue').textContent = `${Math.floor(this.player.data.distance)}m`;
    }

    end(won) {
        this.state = 'gameover';
        const time = Math.floor(this.gameTime);
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;

        const allRacers = [this.player, ...this.opponents].sort((a, b) => b.data.distance - a.data.distance);
        const position = allRacers.indexOf(this.player) + 1;

        document.getElementById('gameOverTitle').textContent = won ? '🏁 YOU WIN! 🏁' : '💥 GAME OVER 💥';
        document.getElementById('finalPosition').textContent = position;
        document.getElementById('finalTime').textContent = `${minutes}m ${seconds}s`;
        document.getElementById('gameOverMessage').textContent = won ? 'You finished in the top 3!' : 'You were defeated!';
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('hud').style.display = 'none';
    }

    render() {
        // Update motorcycle positions based on game data
        const updateMoto = (moto) => {
            moto.position.x = (moto.data.lane) * 12;
            moto.position.z = -moto.data.distance;
            
            // Update health bar
            const healthPercent = moto.data.health / 100;
            moto.healthBar.scale.x = healthPercent;
            const healthColor = moto.data.health > 50 ? 0x00FF00 : moto.data.health > 25 ? 0xFFFF00 : 0xFF0000;
            moto.healthBar.material.color.setHex(healthColor);
        };

        updateMoto(this.player);
        this.opponents.forEach(opp => updateMoto(opp));

        // Update camera to follow player
        const cameraLead = 50;
        this.camera.position.x = this.player.position.x;
        this.camera.position.z = this.player.position.z + cameraLead;
        this.camera.lookAt(this.player.position.x, 10, this.player.position.z - 100);

        this.renderer.render(this.scene, this.camera);
    }

    setupAnimation() {
        let lastTime = Date.now();
        const animate = () => {
            const now = Date.now();
            const dt = Math.min((now - lastTime) / 1000, 0.016);
            lastTime = now;

            this.update(dt);
            this.render();

            requestAnimationFrame(animate);
        };
        animate();
    }
}

// Initialize game on page load
const game = new RoadRash3D();
