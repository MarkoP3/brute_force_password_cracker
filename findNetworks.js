const fs=require('fs');
const exec=require("child_process").exec;
 let availableNetworks=[];
 let wifiInteface;
class Network{
	constructor(name,authentication,encryption){
		this.name=name,
		this.authentication=authentication,
        this.configFilePath=`./profiles/${name}.xml`,
		this.encryption=encryption
		this.hexName=Buffer.from(this.name).toString('hex');
		this.password='';
    }
    connect(password){
	new Promise((resolve,reject)=>{
		let profileConfig=`<?xml version="1.0"?>
        <WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
            <name>${this.name}</name>
            <SSIDConfig>
				<SSID>
					<hex>${this.hexName}</hex>
                    <name>${this.name}</name>
                </SSID>
            </SSIDConfig>
            <connectionType>ESS</connectionType>
            <connectionMode>auto</connectionMode>
            <MSM>
                <security>
                    <authEncryption>
                        <authentication>${this.authentication}PSK</authentication>
                        <encryption>${this.encryption}</encryption>
                        <useOneX>false</useOneX>
                    </authEncryption>
                    <sharedKey>
                        <keyType>passPhrase</keyType>
                        <protected>false</protected>
                        <keyMaterial>${password}</keyMaterial>
                    </sharedKey>
                </security>
            </MSM>
            <MacRandomization xmlns="http://www.microsoft.com/networking/WLAN/profile/v3">
                <enableRandomization>false</enableRandomization>
                <randomizationSeed>4197619519</randomizationSeed>
            </MacRandomization>
        </WLANProfile>`;
		fs.writeFile(this.configFilePath,profileConfig,(error)=>{
			if(error)
			throw error;
			resolve();
		});
	}).then(()=>{

		exec(`netsh wlan add profile filename="${this.configFilePath}" interface="${wifiInteface}"`,(error,stdout,stderr)=>{
			if(error)
			throw error;
			console.log(stdout);
			setTimeout(()=>{
				exec(`netsh wlan show interface"`,(error,stdout,stderr)=>{
					if(stdout.includes('connected'))
						{
							console.log(this.name +" --> Lozinka : "+password);
							this.password=password;
						}
				});
			},2000);
		});
	});	
        
    }

 }
function findNetworks(){
	return new Promise((resolve,reject)=>{
		exec('netsh wlan show networks',(error,stdout,stderr)=>{
			resolve(stdout);
			});
		}).then((networks)=>{
			let netArray=networks.split('\r\n').filter(element=>element.length>0);
			wifiInteface=netArray[1].split(': ')[1].trim();
			netArray.splice(0,3);
			for(let i=0;i<netArray.length;i+=4)
			{
				availableNetworks.push(new Network(netArray[i].split(': ')[1],netArray[i+2].split(': ')[1].split('-')[0],(netArray[i+3].split(': ')[1]==='CCMP '?'AES':netArray[i+3].split(': ')[1].trim())))
			}
		});
}
