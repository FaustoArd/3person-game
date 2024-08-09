import { enable3d,
  Scene3D,
  Canvas,
  THREE,
  JoyStick,
  PointerLock,
  PointerDrag,
  ExtendedObject3D,
  ThirdPersonControls } from '@enable3d/phaser-extension'

  const isTouchDevice = 'ontouchstart' in window

export default class MainScene extends Scene3D {
  private calcL:number;
  private rotationMan:THREE.Vector3;
  private rotationCamera:THREE.Vector3;
  private thetaMan:number;
  private W:any;
  private S:any;
  private A:any;
  private D:any;
  private controls:any;
  private canJump:boolean;
  private isJumping:boolean
  private move:boolean
  private moveTop:number;
  private moveRight:number;
  private man: ExtendedObject3D;
  private enemy: ExtendedObject3D;
  private raycaster: THREE.Raycaster;
  private force:number;
  private playerY:number;
  private playerX:number;
  private redDot:any;
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension()
    this.canJump = true
    this.isJumping = false
    this.move = false

    this.moveTop = 0
    this.moveRight = 0
  }

  create() {
    this.rotationCamera = new THREE.Vector3();
    this.rotationMan = new THREE.Vector3();
    
    this.third.warpSpeed('camera', 'sky', 'grid','light')
    this.third.physics.add.ground({width: 100, height: 100, y:0},{phong: {color: 'green'}})
    this.third.physics.debug?.enable()
    this.man= new ExtendedObject3D()
    this.man.name = 'man';
   // this.addHouse();
    this.addBoxes();

    const animations = ['Jumping', 'LookingAround', 'Running', 'BodyJabCross', 'HipHopDancing','light']
    const pos = { x: 0, y: 1, z: 0 }
    this.third.load.gltf('/assets/glb/box_man.glb').then(object => {
      const man = object.scene.children[0]

        this.man.rotateY(Math.PI + 0.1) // a hack
            this.man.add(man)
      this.third.animationMixers.add(this.man.anims.mixer)
      this.man.anims.add('Idle', object.animations[0])
      this.man.anims.play('Idle')
      this.man.traverse(child => {
        if (child.isMesh){
           child.shape = 'convex'
           child.castShadow = child.receiveShadow = true
        } 
      })
      this.third.animationMixers.add(this.man.anims.mixer)
      object.animations.forEach(animation => {
        if(animation.name){
          animation.tracks.forEach(track => {
            if (/(scale|position)/.test(track.name)) {
              const newValues = track.values.map(v => v * 1)
              track.values = newValues
            }
          })
          this.man.anims.add(animation.name, animation)
        }
      })
      this.man.anims.play('idle')
      
    })
   
   
    this.man.scale.set(1,1,1);
    this.man.position.set(pos.x, pos.y, pos.z)
    this.third.add.existing(this.man)
            this.third.physics.add.existing(this.man, {
              shape: 'capsule',
              radius: 0.2,
              height: 0.6,
              offset: { y: -0.55 }
            })
            this.man.body.setFriction(0.8)
            this.man.body.setAngularFactor(0, 0, 0)
            this.controls = new ThirdPersonControls(this.third.camera, this.man, {
              offset: new THREE.Vector3(0, 1, 0),
              targetRadius: 3
            })
          // add red dot
       

            this.W  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
            this.S  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
            this.A  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.D  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            if (!isTouchDevice) {
              const pointerLock = new PointerLock(this.game.canvas)
              const pointerDrag = new PointerDrag(this.game.canvas)
            
              pointerDrag.onMove(delta => {
                if (!pointerLock.isLocked()) return
                const { x, y } = delta
                this.moveTop = -y
                this.moveRight = x
               });
            }

             this.raycaster = new THREE.Raycaster()
             this.force = 45
            console.log(this.man)
            this.input.on('pointerdown',(pointer)  => {
              // calculate mouse position in normalized device coDordinates
              // (-1 to +1) for both components
              const x = (pointer.x / this.cameras.main.width) * 2 - 1
              const y = -(pointer.y / this.cameras.main.height) * 2 + 1
              const z = 0;
              //this.raycaster.setFromCamera({ x, y }, this.third.camera)
              //this.cameras.main.width / 2, this.cameras.main.height / 2, 4, 0xff0000
              const theta = Math.atan2(this.rotationCamera.x, this.rotationCamera.z)
              const tethaManTest = Math.atan2( this.rotationMan.x,  this.rotationMan.z)
              const thetaY = Math.atan2(this.rotationCamera.y, this.rotationCamera.z)
              const tethaManTestY = Math.atan2( this.rotationMan.y,  this.rotationMan.z)
              console.log('rotationman x:',this.rotationMan.x)
              console.log("Camera x: ",this.rotationMan.x + this.cameras.main.width / 2.22)
             // console.log("theta camera x:",theta)
             // console.log("Theta man x: ",tethaManTest)
             // console.log("Camera y: ",this.cameras.main.width / 2)
             // console.log("theta camera y:",thetaY)
             // console.log("Theta man y: ",tethaManTestY)
            
            // console.log("L:",this.calcL);
            
              const playerVector = new THREE.Vector3(this.man.position.x,this.man.position.y+0.4,this.man.position.z-1.0);
           const cameraVector = new THREE.Vector3( this.rotationCamera.x, this.rotationCamera.y,this.rotationCamera.z);
           //const cameraVector = new THREE.Vector3(x,y,z);
              const pos = new THREE.Vector3()
              this.raycaster.set(playerVector,cameraVector)
              pos.copy(this.raycaster.ray.direction)
              pos.add(this.raycaster.ray.origin)
  
              const sphere = this.third.physics.add.sphere(
                {
                  radius: 0.15,
                  x: pos.x,
                  y: pos.y+0.8,
                  z: pos.z,
                  mass: 20,
                 
                },
                { phong: { color: 0x202020 } }
              )
              sphere.body.setBounciness(0.2)
  
              pos.copy(this.raycaster.ray.direction)
              pos.multiplyScalar(24)
            
              sphere.body.applyForce(pos.x * this.force, pos.y * this.force, pos.z * this.force)
              console.log(pos.x /this.cameras.main.width)
            })
          
           this.addEnemy();
  }

  update() {
  
    if(this.man && this.man.body && this.controls.update){
      const result = this.rotationMan.x +100 + this.cameras.main.width / 2.22
      console.log(result)
      this.redDot = this.add.circle(result, this.cameras.main.height / 2, 4, 0xff0000)
      this.redDot.depth = 3;
      this.man.body.setVelocity(0, 0, 0)
      this.controls.update(this.moveRight * 3, -this.moveTop * 3)
      //this.getPointerDown(this.raycaster,this.force)
      if (!isTouchDevice) this.moveRight = this.moveTop = 0
            /**
             * Player Turn
             */
            const speed = 4
            const v3 = new THREE.Vector3()

           this.rotationCamera = this.third.camera.getWorldDirection(v3)
            const theta = Math.atan2(this.rotationCamera.x, this.rotationCamera.z)
           
           this.rotationMan = this.man.getWorldDirection(v3)
           this.thetaMan = Math.atan2( this.rotationMan.x,  this.rotationMan.z)
            this.man.body.setAngularVelocityY(0)

           this.calcL = Math.abs(theta - this.thetaMan)
           // console.log("L:", this.calcL);
            let rotationSpeed = isTouchDevice ? 2 : 4
            let d = Math.PI / 24
           
            if ( this.calcL > d) {
              if ( this.calcL > Math.PI - d) rotationSpeed *= -1
              if (theta < this.thetaMan) rotationSpeed *= -1
              this.man.body.setAngularVelocityY(rotationSpeed)
            }

            /**
             * Player Move
             */
            if (this.W.isDown || this.move) {
              if (this.man.anims.current === 'idle' && !this.isJumping) this.man.anims.play('run')

              const x = Math.sin(theta) * speed,
                y = this.man.body.velocity.y,
                z = Math.cos(theta) * speed

              this.man.body.setVelocity(x, y, z)
            } else {
              if (this.man.anims.current === 'run' && !this.isJumping) this.man.anims.play('idle')
            }
          if(this.D.isDown || this.move){
            if (this.man.anims.current === 'idle' && !this.isJumping) this.man.anims.play('run')

          }

            /**
             * Player Jump
             */
            // if (this.keys.space.isDown && this.canJump) {
            //   this.jump()
            // }
          
        }
    }
   
 

  addBoxes(){
    this.third.physics.add.box({ y: 1, x: 6, z: 8, breakable: true, fractureImpulse: 5 })
    this.third.physics.add.box({ y: 30, x: 6, z: 8, breakable: true, fractureImpulse: 5 })
    this.third.physics.add.box({ y: 32, x: 6, z: 8, breakable: true, fractureImpulse: 5 })
    this.third.physics.add.cylinder({ y: 1, x: 4, z: -5, height: 5, breakable: true, fractureImpulse: 5 })
    this.third.physics.add.cylinder({ y: 1, x: 6.5, z: -5, height: 5, breakable: true, fractureImpulse: 5 })
    this.third.physics.add.cylinder({ y: 1, x: 9, z: -5, height: 5, breakable: true, fractureImpulse: 5 })
    this.third.physics.add.cylinder({ y: 1, x: 40, z: -5, height: 5, breakable: true, fractureImpulse: 5 })
    this.third.physics.add.cylinder({ y: 1, x: 41, z: -5, height: 5, breakable: true, fractureImpulse: 5 })
    this.third.physics.add.cylinder({ y: 2, x: 41, z: -5, height: 5, breakable: true, fractureImpulse: 5 })
  }


  addHouse(){
    const commonSetting = {
      depth: 0.4,
      breakable: true,
      fractureImpulse: 5,
      collisionFlags: 3
        // front
       
    }
    this.third.physics.add.box({ y: 3, x: 2, z: 4, width: 4, height: 2, ...commonSetting })
    this.third.physics.add.box({ y: 1, x: 2, z: 4, width: 4, height: 2, ...commonSetting })
     this.third.physics.add.box({ y: 1, x: -2, z: 4, width: 4, height: 2, ...commonSetting })
     this.third.physics.add.box({ y: 3, x: -2, z: 4, width: 4, height: 2, ...commonSetting })

  }

  addEnemy(){
    this.enemy = new ExtendedObject3D();
   const enemyAnimations = ['Jumping', 'LookingAround', 'Running', 'BodyJabCross', 'HipHopDancing']
   const pos = {x: 0, y:5,z:0}
   this.third.load.fbx('/assets/fbx/Idle.fbx').then(object => {
    this.enemy.add(object);
    this.third.animationMixers.add(this.man.anims.mixer);
    this.enemy.anims.play('Idle');
    this.enemy.traverse(child => {
      if (child.isMesh) child.castShadow = child.receiveShadow = true
    })
    this.enemy.scale.set(0.01, 0.01, 0.01)
    this.enemy.position.set(pos.x+3, pos.y-2, pos.z)

    this.third.add.existing( this.enemy)
    //this.third.physics.add.existing( this.enemy, { shape: 'box', offset: { y: -0.5 } })
    this.third.physics.add.existing(this.enemy, {
      shape: 'capsule',
      radius: 60.2,
      height: 60.6,
      offset: { y: -0.55 }
    })
    this.enemy.body.setFriction(0.8)
    this.enemy.body.setAngularFactor(0, 0, 0)
    


    enemyAnimations.forEach(key => {
      if (key === 'Idle') return
      this.third.load.fbx(`/assets/fbx/${key}.fbx`).then(object => {
        this.enemy.anims.add(key, object.animations[0])
      })
      // this.time.addEvent({
      //   delay: 2500,
      //   loop: true,
      //   callback: () => {
      //     const anim = Phaser.Math.RND.pick(enemyAnimations)
      //     console.log(`Set animation ${anim}`)
      //     this.enemy.anims.play(anim, 350)
      //   }
      // })
    })

   })
  


  }

   removeEntity() {
    
}
}


