package edu.wlu.graffiti.data.setup;

import java.util.Iterator;
import java.util.Properties;
import java.util.Scanner;

import javax.annotation.Resource;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import edu.wlu.graffiti.dao.FindspotDao;
import edu.wlu.graffiti.dao.GraffitiDao;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;



/**
 * This program translates each property and it's features from the SQL database and json shape files to pompeiiPropertyData.txt,pompeiiPropertyData.js,
 * herculaneumPropertyData.txt, and herculaneumPropertyData.js.
 * Then, the data can be used to efficiently provide data to geoJson for use in the maps of Pompeii and Heracleum. 
 *@author Alicia Martinez
 *@author Kelly McCaffrey -Created functionality for getting the number of Graffiti and automating the process of copying to pompeiiPropertyData.js
 *-Also added all functionality for the Herculaneum map. 
 */

public class StorePropertiesFromDatabaseForgeoJsonMap {
	
	

	//final static String newDBURL = "jdbc:postgresql://hopper.cs.wlu.edu/graffiti5";
	
	//Get the database location using the configuration file instead of hardcoding:
	static String newDBURL;

	final static String SELECT_PROPERTY = FindspotDao.SELECT_BY_CITY_AND_INSULA_AND_PROPERTY_STATEMENT;
	
	final static String GET_NUMBER = GraffitiDao.FIND_BY_PROPERTY;
	
	final static String GET_PROPERTY_TYPE = "SELECT * FROM properties, propertytypes," 
			+ " propertytopropertytype WHERE properties.id = propertytopropertytype.property_id"
			+ " AND propertytypes.id = propertytopropertytype.property_type AND properties.id = ?";
	static Connection newDBCon;

	private static PreparedStatement selectPropertyStatement;
	private static PreparedStatement getPropertyTypeStatement;
	private static PreparedStatement getNumberStatement;
	
	@Resource
	private static GraffitiDao graffitiDaoObject;
	
	private static void init() {
		
		//Sets database url using the configuration file. 
		Properties prop = Utils.getConfigurationProperties();
		newDBURL = prop.getProperty("db.url");
		
		try {
			Class.forName("org.postgresql.Driver");
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}

		try {
			newDBCon = DriverManager.getConnection(newDBURL, "web", "");

			selectPropertyStatement = newDBCon
					.prepareStatement(SELECT_PROPERTY);
			
			getPropertyTypeStatement = newDBCon.prepareStatement(GET_PROPERTY_TYPE);
			
			getNumberStatement=newDBCon.prepareStatement(GET_NUMBER);

		} catch (SQLException e) {
			e.printStackTrace();
		}

	}
	
	public static void main(String args[]) throws JsonProcessingException, IOException {
		
		init();
		
		storeHerculaneum();
		 
		storePompeii();
		
		copyToJavascriptFiles();	
		
	}
	
	/**
	 * Stores the data for Herculaneum in herculaneumPropertyData.txt
	 */
	
	private static void storeHerculaneum(){
		try {
			// creates the file we will later write the updated graffito to
			//This will write to updated eschebach.txt(where the graffito is the combination of properties with attributes)
			//Want to add number of graffiti to this. 
			
			PrintWriter herculaneumTextWriter = new PrintWriter("src/main/webapp/resources/js/herculaneumPropertyData.txt", "UTF-8");
			
			
			
			ObjectMapper herculaneumMapper = new ObjectMapper();
			JsonFactory herculaneumJsonFactory = new JsonFactory();			
			JsonParser herculaneumJsonParser = herculaneumJsonFactory.createParser(new File("src/main/resources/geoJSON/herculaneum.json"));
			
			
			
			JsonNode herculaneumRoot = herculaneumMapper.readTree(herculaneumJsonParser);
			JsonNode herculaneumFeaturesNode = herculaneumRoot.path("features");
			
			
			Iterator<JsonNode> herculaneumIterator = herculaneumFeaturesNode.elements();
			
			while (herculaneumIterator.hasNext()) {
				JsonNode field = herculaneumIterator.next();
				String fieldText = field.toString();
																																																								
				// converts the above string into an InputStream so I can use it in
				// the json parser to iterate through the different tokens
				InputStream stream = new ByteArrayInputStream(fieldText.getBytes(StandardCharsets.UTF_8));
				
				JsonParser parseLine = herculaneumJsonFactory.createParser(stream);
				
				while (parseLine.nextToken() != JsonToken.END_OBJECT) {
					String fieldname = parseLine.getCurrentName();
					
					// when the token is the PRIMARY_DO field, we go to the next
					// token and that is the value
					if("PRIMARY_DO".equals(fieldname)) {
						parseLine.nextToken();
						String primarydo = parseLine.getText();
						if (!primarydo.contains(".")) {continue;}
						String[] parts = primarydo.split("\\.");
						
						String pt1 = parts[0];
						String pt2 = parts[1];
						String pt3 = parts[2];
						
						String insulaName = pt1 + "." + pt2;
						String propertyNum = pt3;
						try {
							selectPropertyStatement.setString(1, "Herculaneum");
							selectPropertyStatement.setString(2, insulaName);
							selectPropertyStatement.setString(3, propertyNum);
							
							ResultSet rs = selectPropertyStatement.executeQuery();
							
							if (rs.next()) {
								int propertyId = rs.getInt("id");
								
								String propertyName = rs.getString("property_name");
								String addProperties = rs.getString("additional_properties");
								String italPropName = rs.getString("italian_property_name");
								String insulaDescription = rs.getString("description");
								String insulaPleiadesId = rs.getString("insula_pleiades_id");
								String propPleiadesId = rs.getString("property_pleiades_id");
								
								getNumberStatement.setInt(1,propertyId);
								ResultSet numberOnPropResultSet=getNumberStatement.executeQuery();
								int numberOfGraffitiOnProperty=0;
								if(numberOnPropResultSet.next()){
									numberOfGraffitiOnProperty=numberOnPropResultSet.getInt(1);
								}
								
								getPropertyTypeStatement.setInt(1, propertyId);
								ResultSet resultset = getPropertyTypeStatement.executeQuery();
								String propertyType = "";
								if (resultset.next()) {
									propertyType = resultset.getString("name");	
								}
								
								ObjectNode graffito = (ObjectNode)field;
								ObjectNode properties = (ObjectNode)graffito.path("properties");
								properties.put("Property_Id", propertyId);
								/*properties.put("Number_Of_Graffiti", numberOfGraffitiOnProperty);*/
								properties.put("Property_Name", propertyName);
								properties.put("Additional_Properties", addProperties);
								properties.put("Italian_Property_Name", italPropName);
								properties.put("Insula_Description", insulaDescription);
								properties.put("Insula_Pleiades_Id", insulaPleiadesId);
								properties.put("Property_Pleiades_Id", propPleiadesId);
								properties.put("Property_Type", propertyType);
								
								JsonNode updatedProps = (JsonNode)properties;
								graffito.set("properties", updatedProps);
								
								// write the newly updated graffito to text file
								System.out.println(graffito);
								
								//jsWriter.println(graffito+",");	
								herculaneumTextWriter.println(graffito +",");
								//readFirstEsch.close();
							}
						} catch (SQLException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
					}
 				}
			}
			
			herculaneumTextWriter.close();
	
			
		}
		
		catch (JsonParseException e) {e.printStackTrace();}
		catch (JsonMappingException e) {e.printStackTrace();}
		catch (IOException e) {e.printStackTrace();}
		
	}
	
	
	/**
	 * Stores the data for Pompeii in herculaneumPropertyData.txt 
	 * @throws IOException 
	 * @throws JsonProcessingException 
	 */
	private static void storePompeii() throws JsonProcessingException, IOException{
		
		try {
			
			PrintWriter pompeiiTextWriter = new PrintWriter("src/main/webapp/resources/js/pompeiiPropertyData.txt", "UTF-8");

			
			// creates necessary objects to parse the original eschebach files
			ObjectMapper pompeiiMapper = new ObjectMapper();
			JsonFactory pompeiiJsonFactory = new JsonFactory();			
			JsonParser pompeiiJsonParser;
			
			pompeiiJsonParser = pompeiiJsonFactory.createParser(new File("src/main/resources/geoJSON/eschebach.json"));
			// this accesses the 'features' level of the eschebach document
			JsonNode pompeiiRoot = pompeiiMapper.readTree(pompeiiJsonParser);
			JsonNode pompeiiFeaturesNode = pompeiiRoot.path("features");
				
			// iterates over the features node
			Iterator<JsonNode> pompeiiIterator = pompeiiFeaturesNode.elements();
			
			
			while (pompeiiIterator.hasNext()) {
				JsonNode field = pompeiiIterator.next();
				String fieldText = field.toString();
																																																								
				// converts the above string into an InputStream so I can use it in
				// the json parser to iterate through the different tokens
				InputStream stream = new ByteArrayInputStream(fieldText.getBytes(StandardCharsets.UTF_8));
				
				JsonParser parseLine = pompeiiJsonFactory.createParser(stream);
				
				while (parseLine.nextToken() != JsonToken.END_OBJECT) {
					String fieldname = parseLine.getCurrentName();
					
					// when the token is the PRIMARY_DO field, we go to the next
					// token and that is the value
					if("PRIMARY_DO".equals(fieldname)) {
						parseLine.nextToken();
						String primarydo = parseLine.getText();
						if (!primarydo.contains(".")) {continue;}
						String[] parts = primarydo.split("\\.");
						
						String pt1 = parts[0];
						String pt2 = parts[1];
						String pt3 = parts[2];
						
						String insulaName = pt1 + "." + pt2;
						String propertyNum = pt3;
						try {
							selectPropertyStatement.setString(1, "Pompeii");
							selectPropertyStatement.setString(2, insulaName);
							selectPropertyStatement.setString(3, propertyNum);
							
							ResultSet rs = selectPropertyStatement.executeQuery();
							
							if (rs.next()) {
								int propertyId = rs.getInt("id");
								
								String propertyName = rs.getString("property_name");
								String addProperties = rs.getString("additional_properties");
								String italPropName = rs.getString("italian_property_name");
								String insulaDescription = rs.getString("description");
								String insulaPleiadesId = rs.getString("insula_pleiades_id");
								String propPleiadesId = rs.getString("property_pleiades_id");
								
								getNumberStatement.setInt(1,propertyId);
								ResultSet numberOnPropResultSet=getNumberStatement.executeQuery();
								int numberOfGraffitiOnProperty=0;
								if(numberOnPropResultSet.next()){
									numberOfGraffitiOnProperty=numberOnPropResultSet.getInt(1);
								}
								
								getPropertyTypeStatement.setInt(1, propertyId);
								ResultSet resultset = getPropertyTypeStatement.executeQuery();
								String propertyType = "";
								if (resultset.next()) {
									propertyType = resultset.getString("name");	
								}
								
								ObjectNode graffito = (ObjectNode)field;
								ObjectNode properties = (ObjectNode)graffito.path("properties");
								properties.put("Property_Id", propertyId);
								properties.put("Number_Of_Graffiti", numberOfGraffitiOnProperty);
								properties.put("Property_Name", propertyName);
								properties.put("Additional_Properties", addProperties);
								properties.put("Italian_Property_Name", italPropName);
								properties.put("Insula_Description", insulaDescription);
								properties.put("Insula_Pleiades_Id", insulaPleiadesId);
								properties.put("Property_Pleiades_Id", propPleiadesId);
								properties.put("Property_Type", propertyType);
								
								JsonNode updatedProps = (JsonNode)properties;
								graffito.set("properties", updatedProps);
								
								// write the newly updated graffito to text file
								System.out.println(graffito);
								
								//jsWriter.println(graffito+",");	
								pompeiiTextWriter.println(graffito +",");
								//readFirstEsch.close();
							}
						} catch (SQLException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
					}
					}
			}
			
			pompeiiTextWriter.close();
		} catch (JsonParseException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		
		
		
		
		
	}
	/**
	 * An independent function for copying from pompeiiPropertyData.txt to pompeiiPropertyData.js with necessary js-specific components. 
	*Copies the data from pompeiiPropertyData.txt to updateEschebach.js in between the [ ]
	*First, creates and writes to a textFile. Then, saves it as a .js file by renaming it. 
	 * @throws FileNotFoundException
	 * @throws UnsupportedEncodingException
	 */
	private static void copyToJavascriptFiles() throws FileNotFoundException, UnsupportedEncodingException{
		PrintWriter pompeiiJsWriter = new PrintWriter("src/main/webapp/resources/js/pompeiiPropertyData.js", "UTF-8");
		//Writes the beginning part of the js file, which it fetches from another text file called jsEschebachFirst.txt.
		//This is the only way I found to format this part of the javascript. 
		File jsFirst=new File("src/main/webapp/resources/js/PropertyDataFirst.txt");
		Scanner jsReadFirst=new Scanner(jsFirst);
		while(jsReadFirst.hasNext()){
			String content=jsReadFirst.nextLine();
			pompeiiJsWriter.println(content);
		}
		
		//Copies from pompeiiPropertyData.txt to pompeiiPropertyData.js for the body portion of the file. 
		File pompeiiUpdatedPText=new File("src/main/webapp/resources/js/pompeiiPropertyData.txt");
		Scanner pompeiiReadFromText=new Scanner(pompeiiUpdatedPText);
		String pompeiiContent;
		while(pompeiiReadFromText.hasNext()){
			pompeiiContent=pompeiiReadFromText.nextLine();
			pompeiiJsWriter.println(pompeiiContent);
		}
		
		PrintWriter herculaneumJsWriter = new PrintWriter("src/main/webapp/resources/js/herculaneumPropertyData.js", "UTF-8");
		jsFirst=new File("src/main/webapp/resources/js/PropertyDataFirst.txt");
		jsReadFirst=new Scanner(jsFirst);
		while(jsReadFirst.hasNext()){
			String content=jsReadFirst.nextLine();
			herculaneumJsWriter.println(content);
		}
		
		//Copies from herculaneumPropertyData.txt to herculaneumPropertyData.js for the body portion of the file. 
		File herculaneumUpdatedPText=new File("src/main/webapp/resources/js/herculaneumPropertyData.txt");
		Scanner herculaneumReadFromText=new Scanner(herculaneumUpdatedPText);
		String herculaneumContent;
		while(herculaneumReadFromText.hasNext()){
			herculaneumContent=herculaneumReadFromText.nextLine();
			herculaneumJsWriter.println(herculaneumContent);
		}
		
		herculaneumJsWriter.println("]};");
		herculaneumReadFromText.close();
		herculaneumJsWriter.close();
		
		
		pompeiiJsWriter.println("]};");
		jsReadFirst.close();
		pompeiiReadFromText.close();
		pompeiiJsWriter.close();
	}
	
}

















