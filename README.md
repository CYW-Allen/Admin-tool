<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="about/logo.png" alt="Logo" width="200">
  </a>
  <div style="font-size:12px;margin:20px;">
    <a href="https://www.flaticon.com/free-icons/database" title="database icons">
      Database icons created by Freepik - Flaticon
    </a>
  </div>

  <h1 align="center">Admin Tool</h1>

  <p align="center" style="font-size:16px">
    A admin tool of the game
    <br />
  </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li><a href="#built-with">Built With</a></li>
    <li>
      <a href="#launch-sample-app">Launch sample app</a>
    </li>
    <li><a href="#functions-showcase">Functions Showcase</a></li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project

### Screen shot
  ![frontpage](/about/frontpage.png)

### Layout architecture
  ![layout architecture](/about/admin_tool_arch.png)

  The diagram above illustrates the hierarchical structure of the application. Rectangles denote specific areas within the app's layout, while rounded rectangles represent individual components. For instance, within the **Header** section, you'll find two components: **`Setting`** and **`OperPanel`**. Inside the **`PlayerInfos`** component, there is a component called **`DataBlock`**, which encapsulates another component named **`ChartComp`**.

### Key functions:
* **Dashboard**: Monitor Daily Active Users (DAU) trends on each server.
* **Statistic**: Retrieve server statistics, including role information, consumption ranking, and online time distribution.
* **PlayerInfos**: Access player information such as account/role data, consumption records, and login history.
* **AccountRelation**: Organize accounts based on IP addresses and apply locking/unlocking action to selected accounts as needed.
* **ChipwarRecords**:  Review the records related to chip wars over specific periods.
* **SaleRecords**: Review the records for items sold in the game mall.
* **PVPHistory**: Review PvP statistics for a specific role over the last month.
* **NamingHistory**: List accounts that have previously used one specific role name.
* **SellingRanking**: Retrieve rankings for in-game items sold by players.
* **BanList**  View a list of banned accounts.
* **NewRoleList**: Explore accounts that have recently created new roles (within the last month).

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## Built With

* [![Vue][Vue-badge]][Vue-url]
* [![Quasar][Quasar-badge]][Vue-url]
* [![Axios][Axios-badge]][Axios-url]
* [![Apexcharts][Apexcharts-badge]][Apexcharts-url]
* [![Fontawesome][Fontawesome-badge]][Fontawesome-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## Launch Sample App

1. Clone the repo
   ```sh
   git clone https://github.com/XXX/Admin-tool.git
   ```
2. Install the dependencies
   ```sh
   npm install
   ```
3. Install Quasar CLI
   ```sh
   npm i -g @quasar/cli
   ```
4. Run the app in dev mode
   ```sh
   quasar dev
   ```
   or for better performance build first
   ```sh
   quasar build
   ```
   and then run the artifact
   ```sh
   cd dist/spa
   quasar serve --history
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## Functions Showcase

### Dashboard
![Page dashboard manipulation](/about/operation-Dashboard-min.gif)

### Statistic
![Page statistic manipulation](/about/operation-Statistic-min.gif)

### PlayerInfos
![Page playerInfos manipulation](/about/operation-PlayerInfos-min.gif)

### Account Relation
![Page accountRelation manipulation](/about/operation-AccountRelation-min.gif)

### ChipWar Records
![Page chipwarRecord manipulation](/about/operation-ChipWarRecords-min.gif)

### Sale Records
![Page saleRecord manipulation](/about/operation-SaleRecords-min.gif)

### PVP History
![Page PVPhistory manipulation](/about/operation-PVPHistory-min.gif)

### Naming History
![Page namingHistory manipulation](/about/operation-NamingHistory-min.gif)

### Selling Ranking
![Page sellingRanking manipulation](/about/operation-SellingRanking-min.gif)

### New Roles List
![Page newRoleList manipulation](/about/operation-NewRolesList-min.gif)

### App config
![Popup appConfig manipulation](/about/operation-AppConfig-min.gif)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[product-screenshot]: images/screenshot.png

[Vue-badge]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Quasar-badge]: https://img.shields.io/badge/Quasar-blue?style=for-the-badge&logo=quasar
[Quasar-url]: https://quasar.dev/
[Apexcharts-badge]: https://img.shields.io/badge/Apexcharts-lightblue?style=for-the-badge&label=%20
[Apexcharts-url]: https://apexcharts.com/
[Axios-badge]: https://img.shields.io/badge/Axios-purple?style=for-the-badge&logo=axios
[Axios-url]: https://axios-http.com/
[Fontawesome-badge]: https://img.shields.io/badge/Font_awesome-lightyellow?style=for-the-badge&logo=fontawesome
[Fontawesome-url]: https://fontawesome.com/

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com
