<?php
/*
 License: Copyright (c) 2011 Anthony. All Rights Reserved.
*/

class Core{
	public static $db = false;
	public $user = false;
	public static function connect(){
		if($db){
			return;
		}
		$username = 'root';
		$password = '';
		$database = 'mysql:host=localhost;dbname=cas';
		try{
			self::$db = new PDO(
								$database,
								$username,
								$password,
								array(PDO::ATTR_PERSISTENT => true)
								);
			self::$db->exec('SET CHARACTER SET utf8');
			self::$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		} catch(PDOException $e){
			print("Error: ". $e->getMessage()."<br />");
			die();
		}
	}
}


define('random_salt','s#dfjsdjfjfsjioejiijoijof#&Y*T#G*');
define('auth_salt', 'sdjjiaijsdfjiijefjijiefnineifijsdfj#*Y#HBF #FN*()F#)(#(((])]]]]])');
if (!isset($_COOKIE['random'])) {
	$random_cookie=sha1(random_salt.rand().rand().'_e');
	setcookie('random',$random_cookie,time()+2592000,'/');
} else {
	$random_cookie=$_COOKIE['random'];
}

$auth_token=sha1(auth_salt . $random_cookie);

function userInitiatedOperation() {
	global $auth_token;
	
	if (isset($_GET['auth'])) {
		if($_GET['auth']==$auth_token) {
			return true;
		}
	} else if (isset($_POST['auth'])) {
		if($_POST['auth']==$auth_token){
			
			#Returns true if the operation was initated by the user.
			return true;
		}
	}
	
	return false;
}
function render_404(){
	header("HTTP/1.1 404 Not Found",1);
	header("Status: 404 Not Found",1);
	require( $_SERVER['DOCUMENT_ROOT'].'/backend/404.html' );
}



$input = NULL;
$r=array();
Core::connect();
if(isset($_COOKIE['id'])){
	if(isset($_COOKIE['k'])){
		$attempt_id=$_COOKIE['id'];
		$attempt_k =$_COOKIE['k'];
		Core::connect();
	}else{
		setcookie('id', '', time() - 3600);
		setcookie('k',  '', time() - 3600);
	}
}
if(isset($_GET['a'])){
	$input = json_decode($_GET['data']);
} else if(isset($_POST['a'])){
	$input = json_decode($_POST['data']);
}

header('Content-Type: text/plain; charset=utf8');
//header('Content-Type: application/json; charset=utf-8');
echo json_encode($r);

?>