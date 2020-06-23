var Product = require('../models/product');
var mongoose = require('mongoose');  

mongoose.connect('mongodb://localhost:27017/shopping',{
    //useMongoClient:true
    useNewUrlParser:true,
    useUnifiedTopology: true 
});

var products=[ 
    new Product({
		imagePath: 'https://a.thumbs.redditmedia.com/41Jhg1UypfSljaq0JYfpITlAqlQNe1BwLn6SMwHCzX0.png',
		title: 'Overwatch',
		description: 'Overwatch is an online team-based game generally played as a first-person shooter. The game features several different game modes, principally designed around squad-based combat with two opposing teams of six players each.',
		price: 10
	}),

	new Product({
		imagePath: 'http://i1-news.softpedia-static.com/images/news2/life-is-strange-review-pc-499548-2.jpg',
		title: 'Life is Strange',
		description: 'Life Is Strange is an episodic graphic adventure video game developed by Dontnod ... It received over 75 Game of the Year awards and listings. It has sold over three million copies as of May 2017. A prequel, Life Is Strange: Before the Storm, was released in August 2017, and a sequel, Life Is Strange 2, in September 2018.',
		price: 20
	}),

	new Product({
		imagePath: 'http://ih0.redbubble.net/image.198189443.1386/pp,220x200-pad,220x200,ffffff.jpg',
		title: 'Fire Emblem Fates: Revelation',
		description: 'Fire Emblem Fates[b] is a tactical role-playing video game for the Nintendo 3DS handheld video game console, developed by Intelligent Systems and Nintendo SPD and published by Nintendo. It was released in June 2015 in Japan, then released internationally in 2016. It is the fourteenth game in the Fire Emblem series,[c] and the second to be developed for Nintendo 3DS after Fire Emblem Awakening. Fates was released in three versions, each following a different storyline centered on the same characters: Birthright[d] and Conquest[e] as physical releases, and Revelation[f] as downloadable content.',
		price: 30
	}),

	new Product({
		imagePath: 'http://fontmeme.com/images/undertale-font.jpg',
		title: 'Undertale',
		description: 'Undertale is a role-playing video game created by indie developer Toby Fox. The player controls a child who has fallen into the Underground: a large, secluded region under the surface of the Earth, separated by a magic barrier. The player meets various monsters during the journey back to the surface.',
		price: 40
	}),

	new Product({
		imagePath: 'http://static3.gamespot.com/uploads/scale_tiny/mig/4/6/3/2/2214632-box_ff12.png',
		title: 'Final Fantasy XII',
		description: 'Final Fantasy XII is a fantasy role-playing video game developed and published by Square Enix for the PlayStation 2 home video console. A part of the Final Fantasy series, the game was released in 2006.',
		price: 50
	})
];
var done = 0;
for(var i = 0; i < products.length; i++){
    products[i].save(function (err, result) {
        done++;
        if(done === products.length){
            exit();
        }
    });
}

function exit() {
    mongoose.disconnect();
}